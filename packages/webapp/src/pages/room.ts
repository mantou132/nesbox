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

import { logout } from 'src/auth';
import { configure } from 'src/configure';
import { routes } from 'src/routes';
import { leaveRoom } from 'src/services/api';
import {
  ChannelMessage,
  ChannelMessageType,
  getButton,
  KeyDownMsg,
  KeyUpMsg,
  Role,
  RoleAnswer,
  RTC,
  TextMsg,
} from 'src/rtc';
import { store } from 'src/store';

import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/button';

const style = createCSSSheet(css`
  :host {
    display: flex;
  }
  .right {
    display: flex;
    flex-direction: column;
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
export class PRoomElement extends GemElement<State> {
  @refobject canvasRef: RefObject<HTMLCanvasElement>;
  @refobject videoRef: RefObject<HTMLVideoElement>;
  @refobject audioRef: RefObject<HTMLAudioElement>;

  state: State = {
    messages: [],
    roles: [],
  };

  get #isHost() {
    return configure.user?.id === configure.user?.playing?.host;
  }

  #nes?: WasmNes;
  #imageData?: ImageData;

  #rtc: RTC;
  #audioContext: AudioContext;

  #enableAudio = () => {
    if (this.#isHost) {
      if (this.#audioContext.state === 'suspended') {
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
    const streamDestination = this.#audioContext.createMediaStreamDestination();
    stream.addTrack(streamDestination.stream.getAudioTracks()[0]);

    if (this.#isHost) {
      const scriptProcessor = this.#audioContext.createScriptProcessor(4096, 0, 1);
      scriptProcessor.connect(this.#audioContext.destination);
      scriptProcessor.connect(streamDestination);
      scriptProcessor.onaudioprocess = (e) => {
        const data = e.outputBuffer.getChannelData(0);
        this.#nes?.update_sample_buffer(data);
      };
    }

    return stream;
  };

  #renderCanvas = () => {
    if (this.#isHost && this.#nes && this.#imageData) {
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
    const rom = 'https://github.com/mantou132/nesbox/files/8713065/legend.nes.zip';
    const zip = await (
      await fetch(`https://cors-anywhere.herokuapp.com/${rom}`, {
        headers: { 'x-requested-with': location.origin },
      })
    ).arrayBuffer();
    const folder = await JSZip.loadAsync(zip);
    const buffer = await Object.values(folder.files)
      .find((e) => e.name.endsWith('.nes'))!
      .async('arraybuffer');
    this.#nes = WasmNes.new();
    this.#nes.set_rom(new Uint8Array(buffer));
    this.#nes.bootup();
    requestAnimationFrame(this.#renderCanvas);
  };

  #onMessage = ({ detail }: CustomEvent<ChannelMessage>) => {
    switch (detail.type) {
      // both
      case ChannelMessageType.CHAT_TEXT:
        this.setState({ messages: [...this.state.messages, detail as TextMsg] });
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

  #init = () => {
    this.#rtc = new RTC();
    this.#rtc.addEventListener('message', this.#onMessage);

    if (configure.user?.playing) {
      this.#rtc.start({
        host: configure.user.playing.host,
        video: this.videoRef.element!,
        stream: this.#createStream(),
      });
      this.#initNes();
    }
  };

  #onKeyDown = (event: KeyboardEvent) => {
    const button = getButton(event);
    if (!button) return;
    if (button !== Button.Reset) this.#enableAudio();
    if (this.#isHost) {
      this.#nes?.press_button(button);
    } else {
      this.#rtc.send(new KeyDownMsg(button));
    }
  };

  #onKeyUp = (event: KeyboardEvent) => {
    const button = getButton(event);
    if (!button) return;
    if (this.#isHost) {
      this.#nes?.release_button(button);
    } else {
      this.#rtc.send(new KeyUpMsg(button));
    }
  };

  mounted = () => {
    this.effect(
      () => {
        if (!configure.user?.playing) {
          history.replace({
            path: createPath(routes.games),
          });
        }
      },
      () => [configure.user?.playing],
    );

    this.#init();

    window.addEventListener('keydown', this.#onKeyDown);
    window.addEventListener('keyup', this.#onKeyUp);
    return () => {
      this.#rtc?.destroy();
      window.removeEventListener('keydown', this.#onKeyDown);
      window.removeEventListener('keyup', this.#onKeyUp);
    };
  };

  render = () => {
    return html`
      <div class="left">
        <div>user: ${configure.user?.id} ${configure.user?.username}</div>
        <div><a href="#" @click=${logout}>logout</a></div>
        <div>game: ${store.games[configure.user?.playing?.gameId || 0]?.name}</div>
        <div><a href="#" @click=${leaveRoom}>leave room</a></div>
        <canvas width="256" height="240" ?hidden=${!this.#isHost} ref=${this.canvasRef.ref}></canvas>
        <video width="256" height="240" ?hidden=${this.#isHost} ref=${this.videoRef.ref}></video>
      </div>
      <div class="right">
        <div>${this.state.roles.map((role, index) => role && html`<div>${index}: ${role.username}</div>`)}</div>
        <dy-input-group>
          <dy-input
            @keydown=${(e: Event) => e.stopPropagation()}
            @keyup=${(e: Event) => e.stopPropagation()}
            @change=${(e: any) => (e.target.value = e.detail)}
          ></dy-input>
          <dy-button @click=${(e: any) => this.#rtc.send(new TextMsg(e.target.previousElementSibling.value))}>
            Send
          </dy-button>
        </dy-input-group>
        <div>Chat:</div>
        <div>${this.state.messages.map((e) => html`<div>${e.username}: ${e.text}</div>`)}</div>
      </div>
    `;
  };
}
