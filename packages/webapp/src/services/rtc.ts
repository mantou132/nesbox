import { configure } from 'src/configure';
import { events, SingalEvent, SingalType } from 'src/constants';
import { ScRoomBasic } from 'src/generated/guestgraphql';
import { sendSignal } from 'src/services/api';

export enum ChannelMessageType {
  NEW_TEXT_MSG,
  KEYDOWN,
}

export class ChannelMessageBase {
  type: ChannelMessageType;
  timestamp: number;
  userId: number;
  username: string;

  constructor() {
    this.timestamp = Date.now();
    this.userId = configure.user!.id;
    this.username = configure.user!.nickname;
  }

  toString() {
    return JSON.stringify(this);
  }
}

export class TextMsg extends ChannelMessageBase {
  text: string;

  constructor(text: string) {
    super();
    this.type = ChannelMessageType.NEW_TEXT_MSG;
    this.text = text;
  }
}

export class KeyDownMsg extends ChannelMessageBase {
  constructor() {
    super();
    this.type = ChannelMessageType.KEYDOWN;
  }
}

export type ChannelMessage = TextMsg;

export class RTC extends EventTarget {
  #isHost = false;

  #connMap = new Map<number, RTCPeerConnection>();
  #channelMap = new Map<RTCPeerConnection, RTCDataChannel>();

  #stream: MediaStream;
  #video: HTMLVideoElement;

  #emit = (data: ChannelMessage) => {
    this.dispatchEvent(new CustomEvent('message', { detail: data }));
  };

  #createRTCPeerConnection = (userId: number) => {
    this.#deleteUser(userId);
    const conn = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
    });
    this.#stream.getTracks().forEach((track) => conn.addTrack(track, this.#stream));
    this.#connMap.set(userId, conn);
    return conn;
  };

  #deleteUser = (userId: number) => {
    const conn = this.#connMap.get(userId);
    this.#connMap.delete(userId);
    if (conn) {
      conn.close();
      const channel = this.#channelMap.get(conn);
      if (channel) {
        channel.onclose = null;
        channel.close();
        this.#channelMap.delete(conn);
      }
    }
  };

  #onSignal = async ({ detail: { userId, singal } }: CustomEvent<SingalEvent>) => {
    switch (singal.type) {
      // host
      case SingalType.OFFER: {
        const conn = this.#createRTCPeerConnection(userId);
        conn.addEventListener('datachannel', ({ channel }) => {
          channel.onopen = () => {
            this.#channelMap.set(conn, channel);
          };
          channel.onmessage = ({ data }: MessageEvent<string>) => {
            const msg = JSON.parse(data) as ChannelMessage;
            if (msg.type === ChannelMessageType.NEW_TEXT_MSG) {
              this.#connMap.forEach((e) => {
                if (e !== conn) this.#channelMap.get(e)?.send(data);
              });
            }
            this.#emit(JSON.parse(data));
          };
          channel.onclose = () => {
            this.#deleteUser(userId);
          };
        });
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
        break;
      }
      // client
      case SingalType.ANSWER: {
        const conn = this.#connMap.get(configure.user!.id);
        await conn?.setRemoteDescription(new RTCSessionDescription(singal.data));
        break;
      }
      // both
      case SingalType.NEW_ICE_CANDIDATE: {
        this.#connMap.get(this.#isHost ? userId : configure.user!.id)?.addIceCandidate(singal.data);
        break;
      }
    }
  };

  #restart = (room: ScRoomBasic) => {
    this.destroy();
    if (configure.user) {
      this.start(room, { stream: this.#stream, video: this.#video });
    }
  };

  start = async (room: ScRoomBasic, { stream, video }: { stream: MediaStream; video: HTMLVideoElement }) => {
    this.#video = video;
    this.#stream = stream;
    this.#isHost = room.host === configure.user!.id;

    if (!this.#isHost) {
      const conn = this.#createRTCPeerConnection(configure.user!.id);

      const channel = conn.createDataChannel('msg');
      channel.onopen = () => {
        this.#channelMap.set(conn, channel);
      };
      channel.onmessage = ({ data }: MessageEvent<string>) => {
        this.#emit(JSON.parse(data));
      };
      channel.onclose = () => {
        this.#restart(room);
      };

      conn.addEventListener('icecandidate', (event) => {
        event.candidate &&
          sendSignal(room.host, {
            type: SingalType.NEW_ICE_CANDIDATE,
            data: event.candidate,
          });
      });

      conn.addEventListener('track', ({ streams }) => {
        this.#video.srcObject = streams[0];
        this.#video.muted = true;
        this.#video.play().catch(() => {
          //
        });
      });

      await conn.setLocalDescription(await conn.createOffer());
      await sendSignal(room.host, {
        type: SingalType.OFFER,
        data: conn.localDescription,
      });
      const timer = setTimeout(() => this.#restart(room), 2000);
      window.addEventListener(events.SINGAL, () => clearTimeout(timer), { once: true });
    }

    window.addEventListener(events.SINGAL, this.#onSignal);
  };

  send = (data: ChannelMessage) => {
    this.#channelMap.forEach((c) => c.send(data.toString()));
    this.#emit(data);
  };

  destroy = () => {
    [...this.#connMap.keys()].forEach((id) => this.#deleteUser(id));
    window.removeEventListener(events.SINGAL, this.#onSignal);
  };
}
