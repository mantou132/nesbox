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
} from '@mantou/gem';
import { createPath } from 'duoyun-ui/elements/route';
import { Button, WasmNes } from 'nes_rust_wasm';
import JSZip from 'jszip';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { waitLoading } from 'duoyun-ui/elements/wait';

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
import { store } from 'src/store';
import { i18n } from 'src/i18n';
import type { MRoomChatElement } from 'src/modules/room-chat';
import { getCorsSrc } from 'src/utils';
import { events } from 'src/constants';

import 'duoyun-ui/elements/input';
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

  constructor() {
    super();
    this.addEventListener('dragover', (e) => e.stopPropagation());
  }

  #nes?: WasmNes;
  #imageData?: ImageData;
  #audioContext?: AudioContext;

  #rtc?: RTC;

  #enableAudio = () => {
    if (this.#isHost) {
      if (this.#audioContext?.state === 'suspended') {
        this.#audioContext.resume();
      }
    } else {
      this.videoRef.element!.muted = false;
    }
  };

  #createStream = () => {
    const stream = new MediaStream();

    const ctx = this.canvasRef.element!.getContext('2d')!;
    stream.addTrack(ctx.canvas.captureStream(60).getVideoTracks()[0]);

    this.#audioContext = new AudioContext({ sampleRate: 44100 });
    this.#audioContext.suspend();
    const streamDestination = this.#audioContext.createMediaStreamDestination();
    stream.addTrack(streamDestination.stream.getAudioTracks()[0]);

    if (this.#isHost) {
      const scriptProcessor = this.#audioContext.createScriptProcessor(4096, 0, 1);
      scriptProcessor.connect(this.#audioContext.destination);
      scriptProcessor.connect(streamDestination);
      scriptProcessor.onaudioprocess = (e) => {
        if (this.#isVisible) {
          const data = e.outputBuffer.getChannelData(0);
          this.#nes?.update_sample_buffer(data);
        }
      };
    }

    return stream;
  };

  #renderCanvas = () => {
    if (this.#isHost && this.#nes && this.#imageData && this.#isVisible) {
      const ctx = this.canvasRef.element!.getContext('2d')!;
      this.#nes.step_frame();
      this.#nes.update_pixels(new Uint8Array(this.#imageData.data.buffer));
      ctx.putImageData(this.#imageData, 0, 0);
    }

    if (this.isConnected) {
      requestAnimationFrame(this.#renderCanvas);
    }
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
    this.#nes = WasmNes.new();
    this.#nes.set_rom(new Uint8Array(buffer));
    this.#nes.bootup();
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
        this.#nes?.press_button((detail as KeyDownMsg).button);
        break;
      // host
      case ChannelMessageType.KEYUP:
        this.#nes?.release_button((detail as KeyUpMsg).button);
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
    const { keybinding } = configure.user!.settings;
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
      this.#nes?.press_button(button);
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
      this.#nes?.release_button(button);
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

  mounted = () => {
    if (this.#isHost) {
      requestAnimationFrame(this.#renderCanvas);
    }

    this.effect(
      () => {
        if (!this.#playing) {
          history.replace({
            path: createPath(routes.games),
          });
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
