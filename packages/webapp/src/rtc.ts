import { createStore, updateStore } from '@mantou/gem';
import { Button, Player } from '@mantou/nes';

import { globalEvents, RTCTransportType, SignalDetail, SignalType } from 'src/constants';
import { configure } from 'src/configure';
import { LocaleKey } from 'src/i18n';
import { logger } from 'src/logger';
import { sendSignal } from 'src/services/api';

export const pingStore = createStore<{ ping?: number }>({});

export enum ChannelMessageType {
  CHAT_TEXT,
  KEYDOWN,
  KEYUP,
  ROLE_OFFER,
  ROLE_ANSWER,
  PING,
  POINTER_MOVE,
}

export type Role =
  | {
      userId: number;
      username: string;
      nickname: string;
    }
  | undefined;

export abstract class ChannelMessageBase {
  type: ChannelMessageType;
  timestamp: number;
  userId: number;
  username: string;
  nickname: string;

  constructor() {
    this.timestamp = Date.now();
    this.userId = configure.user!.id;
    this.username = configure.user!.username;
    this.nickname = configure.user!.nickname;
  }

  toSystemRole() {
    this.userId = 0;
    this.username = '';
    this.nickname = '';
    return this;
  }

  toString() {
    return JSON.stringify(this);
  }
}

export type SysMsg = [LocaleKey, ...string[]];
export class TextMsg extends ChannelMessageBase {
  type = ChannelMessageType.CHAT_TEXT;

  text: string;
  constructor(text: string | SysMsg) {
    super();
    this.text = typeof text === 'string' ? text : text.join('\n');
  }
}

export class PointerMoveMsg extends ChannelMessageBase {
  type = ChannelMessageType.POINTER_MOVE;

  player = Player.One;
  x = 0;
  y = 0;
  dx = 0;
  dy = 0;

  constructor(x: number, y: number, dx: number, dy: number) {
    super();
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
  }
}

export class KeyDownMsg extends ChannelMessageBase {
  type = ChannelMessageType.KEYDOWN;

  player = Player.One;
  button: Button;
  constructor(button: Button) {
    super();
    this.button = button;
  }
}
export class KeyUpMsg extends KeyDownMsg {
  type = ChannelMessageType.KEYUP;
}

export class RoleOffer extends ChannelMessageBase {
  type = ChannelMessageType.ROLE_OFFER;

  // null 表示踢出
  // undefined 表示自动
  roleType?: Player | null;
  constructor(roleType?: Player | null) {
    super();
    this.roleType = roleType;
  }
}

export class RoleAnswer extends ChannelMessageBase {
  type = ChannelMessageType.ROLE_ANSWER;

  roles: Partial<Record<Player, Role>>;
  constructor(roles: Partial<Record<Player, Role>>) {
    super();
    this.roles = roles;
  }
}

export class Ping extends ChannelMessageBase {
  type = ChannelMessageType.PING;

  prevPing?: number;
  constructor(prevPing?: number) {
    super();
    this.prevPing = prevPing;
  }
}

export type ChannelMessage = TextMsg | KeyDownMsg | KeyUpMsg | RoleOffer | RoleAnswer | Ping | PointerMoveMsg;

export class RTC extends EventTarget {
  #host = 0;
  #isHost = false;
  #restartTimer = 0;
  #pingTimer = 0;

  #connMap = new Map<number, RTCPeerConnection>();
  #channelMap = new Map<RTCPeerConnection, RTCDataChannel>();
  #roles: Partial<Record<Player, Role>> = {
    [Player.One]: {
      userId: configure.user!.id,
      username: configure.user!.username,
      nickname: configure.user!.nickname,
    },
  };

  #stream: MediaStream;
  #audio: HTMLAudioElement;

  #emitMessage = (detail: ChannelMessage | ArrayBuffer) => {
    this.dispatchEvent(new CustomEvent('message', { detail }));
  };

  #createRTCPeerConnection = (userId: number) => {
    this.#deleteUser(userId);
    const conn = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        {
          urls: ['turn:eu-0.turn.peerjs.com:3478', 'turn:us-0.turn.peerjs.com:3478'],
          username: 'peerjs',
          credential: 'peerjsp',
        },
      ],
    });
    this.#stream.getTracks().forEach((track) => conn.addTrack(track, this.#stream));
    this.#connMap.set(userId, conn);
    return conn;
  };

  #deleteUser = (userId: number) => {
    const conn = this.#connMap.get(userId);
    this.#connMap.delete(userId);
    if (conn) {
      const channel = this.#channelMap.get(conn);
      if (channel) {
        channel.onclose = null;
        this.#channelMap.delete(conn);
        channel.close();
      }
      conn.close();
    }
  };

  #getPlayer = (userId: number) => {
    const player = (Object.keys(this.#roles) as unknown as Player[]).find(
      (role) => this.#roles[role]?.userId === userId,
    );
    // rust 生成的 enum 值为数字
    return player !== undefined ? (Number(player) as Player) : player;
  };

  #setRoles = (userId: number, msg: RoleOffer) => {
    const role: Role = { userId, username: msg.username, nickname: msg.nickname };
    const player = this.#getPlayer(userId);

    if (msg.roleType === null) {
      // leave
      delete this.#roles[player!];
    } else if ([Player.Two, Player.Three, Player.Four].includes(msg.roleType!) && !this.#roles[msg.roleType!]) {
      // join
      delete this.#roles[player!];
      this.#roles[msg.roleType!] = role;
    } else {
      // auto
      if (player === undefined) {
        if (!this.#roles[Player.Two]) {
          this.#roles[Player.Two] = role;
        } else if (!this.#roles[Player.Three]) {
          this.#roles[Player.Three] = role;
        } else if (!this.#roles[Player.Four]) {
          this.#roles[Player.Four] = role;
        }
      }
    }
  };

  #emitAnswer = () => {
    const roleAnswer = new RoleAnswer(this.#roles);
    this.#channelMap.forEach((channel) => channel.send(roleAnswer.toString()));
    this.#emitMessage(roleAnswer);
  };

  #onDataChannel = (userId: number, conn: RTCPeerConnection, channel: RTCDataChannel) => {
    channel.onopen = () => {
      this.#channelMap.set(conn, channel);

      channel.onclose = () => {
        const nickname = Object.values(this.#roles).find((role) => role?.userId === userId)?.nickname || '';

        this.#deleteUser(userId);
        delete this.#roles[this.#getPlayer(userId)!];
        this.#emitAnswer();

        const textMsg = new TextMsg(['leaveRoomMsg', nickname]).toSystemRole();
        this.#channelMap.forEach((channel) => channel.send(textMsg.toString()));
        this.#emitMessage(textMsg);
      };
    };
    channel.onmessage = ({ data }: MessageEvent<string>) => {
      const msg = JSON.parse(data) as ChannelMessage;
      switch (msg.type) {
        case ChannelMessageType.CHAT_TEXT:
          this.#channelMap.forEach((channel, item) => item !== conn && channel.send(data));
          this.#emitMessage(msg);
          break;
        case ChannelMessageType.KEYDOWN:
        case ChannelMessageType.KEYUP:
        case ChannelMessageType.POINTER_MOVE: {
          const player = this.#getPlayer(userId);
          if (player !== undefined) {
            this.#emitMessage({ ...msg, player } as KeyDownMsg | PointerMoveMsg);
          }
          break;
        }
        case ChannelMessageType.ROLE_OFFER:
          this.#setRoles(userId, msg as RoleOffer);
          this.#emitAnswer();
          break;
        case ChannelMessageType.PING:
          channel.send(data);
          channel.clientPrevPing = (msg as Ping).prevPing;
          break;
      }
    };
  };

  #onOffer = async ({ userId, signal }: SignalDetail) => {
    const conn = this.#createRTCPeerConnection(userId);
    conn.addEventListener('datachannel', ({ channel }) => this.#onDataChannel(userId, conn, channel));
    conn.addEventListener('icecandidate', (event) => {
      event.candidate &&
        sendSignal(userId, {
          type: SignalType.NEW_ICE_CANDIDATE,
          data: event.candidate,
        });
    });
    await conn.setRemoteDescription(new RTCSessionDescription(signal.data));
    await conn.setLocalDescription(await conn.createAnswer());
    await sendSignal(userId, {
      type: SignalType.ANSWER,
      data: conn.localDescription,
    });
  };

  #onSignal = async (event: CustomEvent<SignalDetail>) => {
    const { userId, signal } = event.detail;
    try {
      switch (signal.type) {
        // host
        case SignalType.OFFER:
          this.#onOffer(event.detail);
          break;
        // client
        case SignalType.ANSWER:
          await this.#connMap.get(configure.user!.id)?.setRemoteDescription(new RTCSessionDescription(signal.data));
          break;
        // both
        case SignalType.NEW_ICE_CANDIDATE:
          await this.#connMap.get(this.#isHost ? userId : configure.user!.id)?.addIceCandidate(signal.data);
          break;
      }
    } catch (err) {
      // No remoteDescription.
      // Set remote answer error
      logger.error(err);
    }
  };

  #startClient = async () => {
    const conn = this.#createRTCPeerConnection(configure.user!.id);

    /**
     * 不按顺序接收消息的问题
     * 1. 帧可能乱序，可以在帧数据上添加帧数，但需要复制内存（性能消耗多少？）
     * 2. ping 值不准确
     */
    const channel = conn.createDataChannel('msg', { ordered: false });
    channel.binaryType = 'arraybuffer';
    channel.onopen = () => {
      clearTimeout(this.#restartTimer);
      // `deleteUser` assign `null`
      channel.onclose = () => {
        delete this.#roles[Player.One];
        this.#emitMessage(new RoleAnswer(this.#roles));
        this.#restart();
      };
      this.#channelMap.set(conn, channel);
      // 也许是重连
      this.send(new RoleOffer(this.#getPlayer(configure.user!.id)));

      const textMsg = new TextMsg(['enterRoomMsg', configure.user!.nickname]).toSystemRole();
      this.send(textMsg);

      this.#sendPing();
    };
    channel.onmessage = ({ data }: MessageEvent<string | ArrayBuffer>) => {
      if (typeof data === 'string') {
        const msg = JSON.parse(data) as ChannelMessage;
        switch (msg.type) {
          case ChannelMessageType.PING:
            updateStore(pingStore, { ping: Date.now() - msg.timestamp });
            break;
          case ChannelMessageType.ROLE_ANSWER:
            this.#roles = (msg as RoleAnswer).roles;
            this.#emitMessage(msg);
            break;
          default:
            this.#emitMessage(msg);
            break;
        }
      } else {
        // compressed frame
        this.#emitMessage(data);
      }
    };

    conn.addEventListener('icecandidate', (event) => {
      event.candidate &&
        sendSignal(this.#host, {
          type: SignalType.NEW_ICE_CANDIDATE,
          data: event.candidate,
        });
    });

    conn.addEventListener('icecandidateerror', (event) => {
      logger.error(event);
    });

    conn.addEventListener('track', ({ streams }) => {
      this.#audio.srcObject = streams[0];
      if (this.#audio.paused) {
        this.#audio.muted = true;
        this.#audio.play().catch(() => {
          //
        });
      }
    });

    await conn.setLocalDescription(await conn.createOffer());
    await sendSignal(this.#host, {
      type: SignalType.OFFER,
      data: conn.localDescription,
    });
    this.#restartTimer = window.setTimeout(() => this.#restart(), 2000);
  };

  #sendPing = () => {
    this.send(new Ping(pingStore.ping), false);
    this.#pingTimer = window.setTimeout(this.#sendPing, 1000);
  };

  #restart = () => {
    logger.info('rtc restarting...');
    this.destroy();
    // logout / leave
    if (configure.user?.playing) {
      this.start({ host: this.#host, stream: this.#stream, audio: this.#audio });
    }
  };

  start = async ({ host, stream, audio }: { host: number; stream: MediaStream; audio: HTMLAudioElement }) => {
    this.#audio = audio;
    this.#stream = stream;
    this.#host = host;
    this.#isHost = host === configure.user!.id;

    if (this.#isHost) {
      this.#emitMessage(new RoleAnswer(this.#roles));
    } else {
      this.#startClient();
    }

    addEventListener(globalEvents.SIGNAL, this.#onSignal);
  };

  destroy = () => {
    this.#connMap.forEach((_, id) => this.#deleteUser(id));
    removeEventListener(globalEvents.SIGNAL, this.#onSignal);
    clearTimeout(this.#restartTimer);

    clearInterval(this.#pingTimer);
    updateStore(pingStore, { ping: undefined });
  };

  send = (data: ChannelMessage, emit = true) => {
    this.#channelMap.forEach((c) => {
      if (c.readyState === 'open') {
        c.send(data.toString());
      }
    });
    if (emit) {
      this.#emitMessage(data);
    }
  };

  needSendFrame = () => {
    return !!this.#channelMap.size;
  };

  sendFrame = (frame: Uint8Array, frameNum: number) => {
    if (!frame.length) return;
    this.#channelMap.forEach((channel) => {
      // Wait for client to send ping
      if (!channel.clientPrevPing) return;

      if (configure.user?.settings.video.rtcImprove === RTCTransportType.CLIP) {
        channel.send(frame);
      } else {
        if (frameNum % 2 === 0) {
          channel.send(frame);
        }
      }
    });
  };

  kickOutRole = (userId: number) => {
    if (!this.#isHost) return;
    this.#setRoles(userId, new RoleOffer(null));
    this.send(new RoleAnswer(this.#roles));
  };
}

const dataChannelSend = RTCDataChannel.prototype.send;
RTCDataChannel.prototype.send = function (this: RTCDataChannel, data: string | Blob | ArrayBuffer | ArrayBufferView) {
  try {
    dataChannelSend.apply(this, [data]);
  } catch {
    //
  }
};
