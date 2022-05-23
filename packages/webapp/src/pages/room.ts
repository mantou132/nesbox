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
import { WasmNes, Button } from 'nes_rust_wasm';

import { logout } from 'src/auth';
import { configure } from 'src/configure';
import { routes } from 'src/routes';
import { leaveRoom } from 'src/services/api';
import { ChannelMessage, RTC } from 'src/services/rtc';
import { store } from 'src/store';

const style = createCSSSheet(css``);

type State = {
  start: boolean;
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
    start: false,
  };
  get #isHost() {
    return configure.user?.id === configure.user?.playing?.host;
  }

  constructor() {
    super();
    setInterval(() => {
      this.#nes?.press_button(Button.Joypad1Up);
      setTimeout(() => {
        this.#nes?.release_button(Button.Joypad1Up);
      }, 10);
    }, 1000);
  }

  #nes?: WasmNes;
  #imageData?: ImageData;

  #rtc: RTC;
  #audioContext: AudioContext;

  #createPixelBuf = () => {
    const ctx = this.canvasRef.element!.getContext('2d')!;
    return ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
  };

  #enableAudio = () => {
    if (this.#isHost) {
      if (this.#audioContext.state === 'suspended') {
        this.#audioContext.resume();
      } else {
        this.#audioContext.suspend();
      }
    } else {
      this.videoRef.element!.muted = !this.videoRef.element!.muted;
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

  #initNes = async () => {
    if (!this.#isHost) return;
    const buffer = await (await fetch('https://takahirox.github.io/nes-rust/roms/nestest.nes')).arrayBuffer();
    this.#nes = WasmNes.new();
    this.#nes.set_rom(new Uint8Array(buffer));
    this.#nes.bootup();
  };

  #tick = () => {
    if (this.#isHost && this.#nes && this.#imageData) {
      const ctx = this.canvasRef.element!.getContext('2d')!;
      this.#nes.step_frame();
      this.#nes.update_pixels(new Uint8Array(this.#imageData.data.buffer));
      ctx.putImageData(this.#imageData, 0, 0);
    }

    if (this.isConnected) {
      requestAnimationFrame(this.#tick);
    }
  };

  #init = () => {
    this.#rtc = new RTC();
    this.#rtc.addEventListener('message', ({ detail }: CustomEvent<ChannelMessage>) => {
      console.log('[MESSAGE]:', detail);
    });

    if (configure.user?.playing) {
      this.#rtc.start(configure.user.playing, {
        video: this.videoRef.element!,
        stream: this.#createStream(),
      });
      this.#initNes();
      this.#imageData = this.#createPixelBuf();
    }

    requestAnimationFrame(this.#tick);
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
    return () => {
      this.#rtc?.destroy();
    };
  };

  render = () => {
    return html`
      <div>user: ${configure.user?.id}</div>
      <div @click=${logout}>logout</div>
      <div>game: ${store.games[configure.user?.playing?.gameId || 0]?.name}</div>
      <div @click=${leaveRoom}>leave room</div>
      <canvas width="256" height="240" ?hidden=${!this.#isHost} ref=${this.canvasRef.ref}></canvas>
      <video width="256" height="240" ?hidden=${this.#isHost} ref=${this.videoRef.ref}></video>
      <div @click=${this.#enableAudio}>start audio</div>
    `;
  };
}
