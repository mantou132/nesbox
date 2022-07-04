import { Button } from '@nesbox/nes';

import { configure } from 'src/configure';
import { events, SingalEvent, SingalType } from 'src/constants';
import { i18n } from 'src/i18n';
import { logger } from 'src/logger';
import { sendSignal } from 'src/services/api';
import { getTempText } from 'src/utils';

const buttonMap: Record<Button, Record<string, Button | undefined>> = {
  [Button.Joypad1Up]: { '2': Button.Joypad2Up, '3': Button.Joypad3Up, '4': Button.Joypad4Up },
  [Button.Joypad1Left]: { '2': Button.Joypad2Left, '3': Button.Joypad3Left, '4': Button.Joypad4Left },
  [Button.Joypad1Down]: { '2': Button.Joypad2Down, '3': Button.Joypad3Down, '4': Button.Joypad4Down },
  [Button.Joypad1Right]: { '2': Button.Joypad2Right, '3': Button.Joypad3Right, '4': Button.Joypad4Right },
  [Button.Joypad1A]: { '2': Button.Joypad2A, '3': Button.Joypad3A, '4': Button.Joypad4A },
  [Button.Joypad1B]: { '2': Button.Joypad2B, '3': Button.Joypad3B, '4': Button.Joypad4B },
  [Button.Select]: {},
  [Button.Start]: {},
  [Button.Reset]: {},
};

export enum ChannelMessageType {
  CHAT_TEXT,
  KEYDOWN,
  KEYUP,
  ROLE_OFFER,
  ROLE_ANSWER,
}

export type Role =
  | {
      userId: number;
      username: string;
    }
  | undefined;

export abstract class ChannelMessageBase {
  type: ChannelMessageType;
  timestamp: number;
  userId: number;
  username: string;

  constructor() {
    this.timestamp = Date.now();
    this.userId = configure.user!.id;
    this.username = configure.user!.nickname;
  }

  toSystemRole() {
    this.userId = 0;
    this.username = '系统';
    return this;
  }

  toString() {
    return JSON.stringify(this);
  }
}

export class TextMsg extends ChannelMessageBase {
  type = ChannelMessageType.CHAT_TEXT;

  text: string;
  constructor(text: string) {
    super();
    this.text = text;
  }
}

export class KeyDownMsg extends ChannelMessageBase {
  type = ChannelMessageType.KEYDOWN;

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

  roleType?: number;
  constructor(roleType?: number) {
    super();
    this.roleType = roleType;
  }
}

export class RoleAnswer extends ChannelMessageBase {
  type = ChannelMessageType.ROLE_ANSWER;

  roles: Role[];
  constructor(roles: Role[]) {
    super();
    this.roles = roles;
  }
}

export type ChannelMessage = TextMsg | KeyDownMsg | KeyUpMsg | RoleOffer | RoleAnswer;

export class RTC extends EventTarget {
  #host = 0;
  #isHost = false;
  #restartTimer = 0;

  #connMap = new Map<number, RTCPeerConnection>();
  #channelMap = new Map<RTCPeerConnection, RTCDataChannel>();
  #roles: Role[] = [, { userId: configure.user!.id, username: configure.user!.nickname }];

  #stream: MediaStream;
  #video: HTMLVideoElement;

  #emitMessage = (detail: ChannelMessage) => {
    this.dispatchEvent(new CustomEvent('message', { detail }));
  };

  #createRTCPeerConnection = (userId: number) => {
    this.#deleteUser(userId);
    const conn = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.services.mozilla.com' }, { urls: 'stun:stun3.l.google.com:19302' }],
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

  #getButton = (userId: number, button: Button) => {
    if (userId === configure.user!.id) return button;
    const index = this.#roles.findIndex((role) => role?.userId === userId);
    return buttonMap[button][index];
  };

  #setRoles = (userId: number, msg: RoleOffer) => {
    const role: Role = { userId, username: msg.username };
    const index = this.#roles.findIndex((role) => role?.userId === userId);

    if (msg.roleType === 0) {
      // leave
      this.#roles[index] = undefined;
    } else if (msg.roleType && [2, 3, 4].includes(msg.roleType) && !this.#roles[msg.roleType]) {
      // join
      if (index > 1) this.#roles[index] = undefined;
      this.#roles[msg.roleType] = role;
    } else {
      // auto
      if (index === -1) {
        if (!this.#roles[2]) {
          this.#roles[2] = role;
        } else if (!this.#roles[3]) {
          this.#roles[3] = role;
        } else if (!this.#roles[4]) {
          this.#roles[4] = role;
        }
      }
    }
  };

  #emitAnswer = () => {
    const roleAnswer = new RoleAnswer([...this.#roles]);
    this.#channelMap.forEach((channel) => channel.send(roleAnswer.toString()));
    this.#emitMessage(roleAnswer);
  };

  #onDataChannel = (userId: number, conn: RTCPeerConnection, channel: RTCDataChannel) => {
    channel.onopen = () => {
      this.#channelMap.set(conn, channel);

      channel.onclose = () => {
        const username = this.#roles.find((role) => role?.userId === userId)?.username || '';

        this.#deleteUser(userId);
        this.#roles = this.#roles.map((role) => (role?.userId === userId ? undefined : role));
        this.#emitAnswer();

        const textMsg = new TextMsg(getTempText(i18n.get('leaveRoomMsg', username))).toSystemRole();
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
          const button = this.#getButton(userId, (msg as KeyDownMsg).button);
          if (button) {
            this.#emitMessage({ ...msg, button } as KeyDownMsg);
          }
          break;
        case ChannelMessageType.ROLE_OFFER:
          this.#setRoles(userId, msg as RoleOffer);
          this.#emitAnswer();
          break;
      }
    };
  };

  #onOffer = async ({ userId, singal }: SingalEvent) => {
    const conn = this.#createRTCPeerConnection(userId);
    conn.addEventListener('datachannel', ({ channel }) => this.#onDataChannel(userId, conn, channel));
    conn.addEventListener('icecandidate', (event) => {
      event.candidate &&
        sendSignal(userId, {
          type: SingalType.NEW_ICE_CANDIDATE,
          data: event.candidate,
        });
    });
    await conn.setRemoteDescription(new RTCSessionDescription(singal.data));
    await conn.setLocalDescription(await conn.createAnswer());
    await sendSignal(userId, {
      type: SingalType.ANSWER,
      data: conn.localDescription,
    });
  };

  #onSignal = async (event: CustomEvent<SingalEvent>) => {
    const { userId, singal } = event.detail;
    try {
      switch (singal.type) {
        // host
        case SingalType.OFFER:
          this.#onOffer(event.detail);
          break;
        // client
        case SingalType.ANSWER:
          await this.#connMap.get(configure.user!.id)?.setRemoteDescription(new RTCSessionDescription(singal.data));
          break;
        // both
        case SingalType.NEW_ICE_CANDIDATE:
          await this.#connMap.get(this.#isHost ? userId : configure.user!.id)?.addIceCandidate(singal.data);
          break;
      }
    } catch (err) {
      // No remoteDescription.
      // Set remote anser error
      logger.error(err);
    }
  };

  #startClient = async () => {
    const conn = this.#createRTCPeerConnection(configure.user!.id);

    const channel = conn.createDataChannel('msg');
    channel.onopen = () => {
      clearTimeout(this.#restartTimer);
      // `deleteUser` assign `null`
      channel.onclose = () => {
        this.#restart();
      };
      this.#channelMap.set(conn, channel);
      this.send(new RoleOffer(this.#roles.findIndex((role) => role?.userId === configure.user!.id)));

      const textMsg = new TextMsg(getTempText(i18n.get('enterRoomMsg', configure.user!.nickname))).toSystemRole();
      this.send(textMsg);
    };
    channel.onmessage = ({ data }: MessageEvent<string>) => {
      const msg = JSON.parse(data) as ChannelMessage;
      this.#emitMessage(msg);
    };

    conn.addEventListener('icecandidate', (event) => {
      event.candidate &&
        sendSignal(this.#host, {
          type: SingalType.NEW_ICE_CANDIDATE,
          data: event.candidate,
        });
    });

    conn.addEventListener('icecandidateerror', (event) => {
      logger.error(event);
    });

    conn.addEventListener('track', ({ streams }) => {
      this.#video.srcObject = streams[0];
      if (this.#video.paused) {
        this.#video.muted = true;
        this.#video.play().catch(() => {
          //
        });
      }
    });

    await conn.setLocalDescription(await conn.createOffer());
    await sendSignal(this.#host, {
      type: SingalType.OFFER,
      data: conn.localDescription,
    });
    this.#restartTimer = window.setTimeout(() => this.#restart(), 2000);
  };

  #restart = () => {
    logger.info('rtc restarting...');
    this.destroy();
    // logout / leave
    if (configure.user?.playing) {
      this.start({ host: this.#host, stream: this.#stream, video: this.#video });
    }
  };

  start = async ({ host, stream, video }: { host: number; stream: MediaStream; video: HTMLVideoElement }) => {
    this.#video = video;
    this.#stream = stream;
    this.#host = host;
    this.#isHost = host === configure.user!.id;

    if (this.#isHost) {
      this.#emitMessage(new RoleAnswer(this.#roles));
    } else {
      this.#startClient();
    }

    addEventListener(events.SINGAL, this.#onSignal);
  };

  destroy = () => {
    this.#connMap.forEach((_, id) => this.#deleteUser(id));
    removeEventListener(events.SINGAL, this.#onSignal);
    clearTimeout(this.#restartTimer);
  };

  send = (data: ChannelMessage) => {
    this.#channelMap.forEach((c) => c.send(data.toString()));
    this.#emitMessage(data);
  };

  kickoutRole = (userId: number) => {
    if (!this.#isHost) return;
    this.#setRoles(userId, new RoleOffer(0));
    this.send(new RoleAnswer(this.#roles));
  };
}
