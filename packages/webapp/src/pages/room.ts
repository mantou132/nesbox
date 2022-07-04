import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  history,
  refobject,
  RefObject,
  QueryString,
} from '@mantou/gem';
import { createPath } from 'duoyun-ui/elements/route';
import JSZip from 'jszip';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { waitLoading } from 'duoyun-ui/elements/wait';
import init, { Nes, Button } from '@nesbox/nes';
import { ContextMenu } from 'duoyun-ui/elements/menu';
import { Modal } from 'duoyun-ui/elements/modal';
import { DuoyunInputElement } from 'duoyun-ui/elements/input';
import { isNotBoolean } from 'duoyun-ui/lib/types';

import { configure } from 'src/configure';
import { routes } from 'src/routes';
import {
  ChannelMessage,
  ChannelMessageType,
  KeyDownMsg,
  KeyUpMsg,
  Role,
  RoleAnswer,
  RoleOffer,
  RTC,
  TextMsg,
} from 'src/rtc';
import { friendStore, store } from 'src/store';
import { i18n } from 'src/i18n';
import type { MRoomChatElement } from 'src/modules/room-chat';
import { getCorsSrc } from 'src/utils';
import { events, queryKeys } from 'src/constants';
import { createInvite } from 'src/services/api';

import 'src/modules/room-player-list';
import 'src/modules/room-chat';
import 'src/modules/nav';

const style = createCSSSheet(css`
  :host {
    position: absolute;
    inset: 0;
    display: flex;
  }
  .canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 5em;
    object-fit: contain;
    background-color: black;
    image-rendering: pixelated;
    pointer-events: none;
  }
  .chat {
    position: absolute;
    inset: auto auto 1rem 1rem;
    width: min(30vw, 20em);
    height: min(40vh, 50em);
  }
  .player-list {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 1rem;
    box-sizing: border-box;
    width: min(38em, 100vw);
    padding-inline: 1rem;
  }
`);

type State = {
  messages: TextMsg[];
  roles: Role[];
};

/**
 * @customElement p-room
 */
@customElement('p-room')
@connectStore(store)
@connectStore(configure)
@adoptedStyle(style)
@connectStore(i18n.store)
export class PRoomElement extends GemElement<State> {
  @refobject canvasRef: RefObject<HTMLCanvasElement>;
  @refobject videoRef: RefObject<HTMLVideoElement>;
  @refobject chatRef: RefObject<MRoomChatElement>;

  state: State = {
    messages: [],
    roles: [],
  };

  get #settings() {
    return configure.user?.settings;
  }

  get #playing() {
    return configure.user?.playing;
  }

  get #isHost() {
    return configure.user?.id === this.#playing?.host;
  }

  get #rom() {
    return store.games[this.#playing?.gameId || 0]?.rom;
  }

  get #isVisible() {
    return document.visibilityState === 'visible';
  }

  #nes?: Nes;
  #imageData?: ImageData;
  #audioContext?: AudioContext;
  #streamDestination?: MediaStreamAudioDestinationNode;
  #gainNode?: GainNode;
  #rtc?: RTC;

  #enableAudio = () => {
    if (this.#isHost) {
      this.#nes?.set_sound(true);
    } else {
      this.videoRef.element!.muted = false;
    }
  };

  #createStream = () => {
    const stream = new MediaStream();

    const ctx = this.canvasRef.element!.getContext('2d')!;
    stream.addTrack(ctx.canvas.captureStream(60).getVideoTracks()[0]);

    this.#audioContext = new AudioContext({ sampleRate: 48000 });
    this.#streamDestination = this.#audioContext.createMediaStreamDestination();
    this.#gainNode = this.#audioContext.createGain();
    this.#gainNode.gain.value = this.#settings?.volume.game || 1;
    this.#gainNode.connect(this.#audioContext.destination);
    stream.addTrack(this.#streamDestination.stream.getAudioTracks()[0]);
    return stream;
  };

  #nextStartTime = 0;
  #loop = () => {
    if (this.isConnected) {
      requestAnimationFrame(this.#loop);
    }

    if (!this.#isHost || !this.#nes || !this.#imageData || !this.#isVisible) return;
    this.#nes.clock_seconds(1 / 60);

    const memory = Nes.memory();

    const frameLen = this.#nes.frame_len();
    const framePtr = this.#nes.frame();
    new Uint8Array(this.#imageData.data.buffer).set(new Uint8Array(memory.buffer, framePtr, frameLen));
    this.canvasRef.element!.getContext('2d')!.putImageData(this.#imageData, 0, 0);

    if (!this.#nes.sound() || !this.#audioContext || !this.#streamDestination || !this.#gainNode) return;
    const bufferSize = this.#nes.buffer_capacity();
    const sampleRate = this.#nes.sample_rate();
    const samplesPtr = this.#nes.samples();
    const audioBuffer = this.#audioContext.createBuffer(1, bufferSize, sampleRate);
    audioBuffer.getChannelData(0).set(new Float32Array(memory.buffer, samplesPtr, bufferSize));
    const node = this.#audioContext.createBufferSource();
    node.connect(this.#gainNode);
    node.connect(this.#streamDestination);
    node.buffer = audioBuffer;
    const start = Math.max(this.#nextStartTime || 0, this.#audioContext.currentTime + bufferSize / sampleRate);
    node.start(start);
    this.#nextStartTime = start + bufferSize / sampleRate;
  };

  #initNes = async () => {
    if (!this.#isHost) return;
    const ctx = this.canvasRef.element!.getContext('2d')!;
    this.#imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);

    const zip = await (await fetch(getCorsSrc(this.#rom!))).arrayBuffer();
    const folder = await JSZip.loadAsync(zip);
    const buffer = await Object.values(folder.files)
      .find((e) => e.name.toLowerCase().endsWith('.nes'))!
      .async('arraybuffer');

    await init();
    this.#nes = Nes.new(48000, 800, 0.02);
    this.#nes.load_rom(new Uint8Array(buffer));
  };

  #onMessage = ({ detail }: CustomEvent<ChannelMessage>) => {
    switch (detail.type) {
      // both
      case ChannelMessageType.CHAT_TEXT:
        this.setState({ messages: [detail as TextMsg, ...this.state.messages] });
        break;
      // both
      case ChannelMessageType.ROLE_ANSWER:
        this.setState({ roles: (detail as RoleAnswer).roles });
        break;
      // host
      case ChannelMessageType.KEYDOWN:
        this.#nes?.handle_event((detail as KeyDownMsg).button, true, false);
        break;
      // host
      case ChannelMessageType.KEYUP:
        this.#nes?.handle_event((detail as KeyUpMsg).button, false, false);
        break;
    }
  };

  #initRtc = () => {
    this.#rtc = new RTC();
    this.#rtc.addEventListener('message', this.#onMessage);

    if (this.#playing) {
      this.#rtc.start({
        host: this.#playing.host,
        video: this.videoRef.element!,
        stream: this.#createStream(),
      });
    }
  };

  #getButton = (event: KeyboardEvent) => {
    const { keybinding } = this.#settings!;
    const map: Record<string, Button> = {
      [keybinding.Up]: Button.Joypad1Up,
      [keybinding.Left]: Button.Joypad1Left,
      [keybinding.Down]: Button.Joypad1Down,
      [keybinding.Right]: Button.Joypad1Right,
      [keybinding.A]: Button.Joypad1A,
      [keybinding.B]: Button.Joypad1B,
      [keybinding.Select]: Button.Select,
      [keybinding.Start]: Button.Start,

      [keybinding.Up_2]: Button.Joypad2Up,
      [keybinding.Left_2]: Button.Joypad2Left,
      [keybinding.Down_2]: Button.Joypad2Down,
      [keybinding.Right_2]: Button.Joypad2Right,
      [keybinding.A_2]: Button.Joypad2A,
      [keybinding.B_2]: Button.Joypad2B,
    };
    return map[event.key.toLowerCase()];
  };

  #pressButton = (button: Button) => {
    if (button !== Button.Reset) this.#enableAudio();
    if (this.#isHost) {
      this.#nes?.handle_event(button, true, false);
    } else {
      this.#rtc?.send(new KeyDownMsg(button));
    }
  };

  #onPressButton = (event: CustomEvent<Button>) => {
    this.#pressButton(event.detail);
  };

  #onKeyDown = (event: KeyboardEvent) => {
    const button = this.#getButton(event);
    if (!button) {
      hotkeys({
        enter: () => this.chatRef.element?.focus(),
      })(event);
      return;
    }
    this.#pressButton(button);
  };

  #releaseButton = (button: Button) => {
    if (this.#isHost) {
      this.#nes?.handle_event(button, false, false);
    } else {
      this.#rtc?.send(new KeyUpMsg(button));
    }
  };

  #onReleaseButton = (event: CustomEvent<Button>) => {
    this.#releaseButton(event.detail);
  };

  #onKeyUp = (event: KeyboardEvent) => {
    const button = this.#getButton(event);
    if (!button) return;
    this.#releaseButton(button);
  };

  #onContextMenu = (event: MouseEvent) => {
    if (!this.#playing) return;
    ContextMenu.open(
      [
        !!friendStore.friendIds?.length && {
          text: '邀请好友',
          menu: friendStore.friendIds?.map((id) => ({
            text: friendStore.friends[id]?.user.nickname || '',
            handle: () => createInvite({ roomId: this.#playing!.id, targetId: id }),
          })),
        },
        {
          text: '邀请',
          handle: async () => {
            const input = await Modal.open<DuoyunInputElement>({
              header: '邀请',
              body: html`
                <dy-input
                  autofocus
                  style="width: 100%"
                  placeholder=${i18n.get('placeholderUsername')}
                  @change=${(e: any) => (e.target.value = e.detail)}
                ></dy-input>
              `,
            });
            createInvite({ roomId: this.#playing!.id, targetId: 0, tryUsername: input.value });
          },
        },
        {
          text: '分享',
          handle: () => {
            navigator
              .share({
                url: `${location.origin}${createPath(routes.games)}${new QueryString({
                  [queryKeys.JOIN_ROOM]: this.#playing!.id,
                })}`,
                text: `一起来玩 ${store.games[this.#playing!.gameId]?.name}`,
              })
              .catch(() => {
                //
              });
          },
        },
      ].filter(isNotBoolean),
      {
        x: event.clientX,
        y: event.clientY,
      },
    );
  };

  mounted = () => {
    if (this.#isHost) {
      requestAnimationFrame(this.#loop);
    }

    this.effect(
      () => {
        if (this.#settings && this.#gainNode) {
          this.#gainNode.gain.value = this.#settings.volume.game;
        }
      },
      () => [this.#settings?.volume.game],
    );

    this.effect(
      () => {
        if (!this.#playing) {
          history.replace({
            path: createPath(routes.games),
          });
          ContextMenu.close();
        }
      },
      () => [this.#playing],
    );

    this.effect(
      () => {
        if (this.#playing) {
          this.#rtc?.destroy();
          this.#audioContext?.close();
          this.#initRtc();
        }

        if (this.#rom) {
          waitLoading(this.#initNes());
        }
      },
      () => [this.#playing?.id, this.#rom],
    );

    this.addEventListener('contextmenu', this.#onContextMenu);

    addEventListener('keydown', this.#onKeyDown);
    addEventListener('keyup', this.#onKeyUp);
    addEventListener(events.PRESS_BUTTON, this.#onPressButton);
    addEventListener(events.RELEASE_BUTTON, this.#onReleaseButton);
    return () => {
      this.#audioContext?.close();
      this.#rtc?.destroy();
      removeEventListener('keydown', this.#onKeyDown);
      removeEventListener('keyup', this.#onKeyUp);
      removeEventListener(events.PRESS_BUTTON, this.#onPressButton);
      removeEventListener(events.RELEASE_BUTTON, this.#onReleaseButton);
    };
  };

  render = () => {
    const { messages, roles } = this.state;

    return html`
      <canvas class="canvas" width="256" height="240" ?hidden=${!this.#isHost} ref=${this.canvasRef.ref}></canvas>
      <video class="canvas" ?hidden=${this.#isHost} ref=${this.videoRef.ref}></video>
      <m-room-chat
        class="chat"
        ref=${this.chatRef.ref}
        .messages=${messages}
        @submit=${({ detail }: CustomEvent<TextMsg>) => this.#rtc?.send(detail)}
      ></m-room-chat>
      <m-room-player-list
        class="player-list"
        .isHost=${this.#isHost}
        .roles=${roles}
        @rolechange=${({ detail }: CustomEvent<RoleOffer>) => this.#rtc?.send(detail)}
        @kickout=${({ detail }: CustomEvent<number>) => this.#rtc?.kickoutRole(detail)}
      ></m-room-player-list>
    `;
  };
}
