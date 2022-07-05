import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  refobject,
  RefObject,
} from '@mantou/gem';
import { locale } from 'duoyun-ui/lib/locale';
import init, { Button, Nes } from '@mantou/nes';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { Modal } from 'duoyun-ui/elements/modal';

import { configure, defaultKeybinding } from 'src/configure';

import 'duoyun-ui/elements/heading';

const style = createCSSSheet(css`
  .canvas {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: contain;
    background-color: black;
    image-rendering: pixelated;
  }
  .nodata {
    position: absolute;
    inset: 0;
    display: flex;
    place-content: center;
    place-items: center;
    margin-block-start: -10vh;
  }
  .nodata[hidden] {
    display: none;
  }
`);

/**
 * @customElement p-emulator
 */
@customElement('p-emulator')
@adoptedStyle(style)
@connectStore(configure)
export class PEmulatorElement extends GemElement {
  @refobject canvasRef: RefObject<HTMLCanvasElement>;

  get #isVisible() {
    return document.visibilityState === 'visible';
  }

  #nes?: Nes;
  #imageData?: ImageData;
  #audioContext?: AudioContext;

  #enableAudio = () => {
    this.#nes?.set_sound(true);
  };

  #getButton = (event: KeyboardEvent) => {
    const map: Record<string, Button> = {
      [defaultKeybinding.Up]: Button.Joypad1Up,
      [defaultKeybinding.Left]: Button.Joypad1Left,
      [defaultKeybinding.Down]: Button.Joypad1Down,
      [defaultKeybinding.Right]: Button.Joypad1Right,
      [defaultKeybinding.A]: Button.Joypad1A,
      [defaultKeybinding.B]: Button.Joypad1B,
      [defaultKeybinding.Select]: Button.Select,
      [defaultKeybinding.Start]: Button.Start,
      [defaultKeybinding.Reset]: Button.Reset,

      [defaultKeybinding.Up_2]: Button.Joypad2Up,
      [defaultKeybinding.Left_2]: Button.Joypad2Left,
      [defaultKeybinding.Down_2]: Button.Joypad2Down,
      [defaultKeybinding.Right_2]: Button.Joypad2Right,
      [defaultKeybinding.A_2]: Button.Joypad2A,
      [defaultKeybinding.B_2]: Button.Joypad2B,
    };
    return map[event.key.toLowerCase()];
  };

  #quit = async () => {
    await Modal.confirm('回到首页？');
    window.location.replace(`/`);
  };

  #onKeyDown = (event: KeyboardEvent) => {
    const button = this.#getButton(event);
    if (!button) {
      hotkeys({ esc: this.#quit })(event);
      return;
    }
    if (button === Button.Reset) {
      this.#nes?.power_cycle();
    } else {
      this.#enableAudio();
    }
    this.#nes?.handle_event(button, true, event.repeat);
  };

  #onKeyUp = (event: KeyboardEvent) => {
    const button = this.#getButton(event);
    if (!button) return;
    this.#nes?.handle_event(button, false, event.repeat);
  };

  #nextStartTime = 0;
  #loop = () => {
    if (this.isConnected) {
      requestAnimationFrame(this.#loop);
    }

    if (!this.#nes || !this.#imageData || !this.#isVisible) return;
    this.#nes.clock_seconds(1 / 60);

    const memory = Nes.memory();

    const frameLen = this.#nes.frame_len();
    const framePtr = this.#nes.frame();
    new Uint8Array(this.#imageData.data.buffer).set(new Uint8Array(memory.buffer, framePtr, frameLen));
    this.canvasRef.element!.getContext('2d')!.putImageData(this.#imageData, 0, 0);

    if (!this.#nes.sound() || !this.#audioContext) return;
    const bufferSize = this.#nes.buffer_capacity();
    const sampleRate = this.#nes.sample_rate();
    const samplesPtr = this.#nes.samples();
    const audioBuffer = this.#audioContext.createBuffer(1, bufferSize, sampleRate);
    audioBuffer.getChannelData(0).set(new Float32Array(memory.buffer, samplesPtr, bufferSize));
    const node = this.#audioContext.createBufferSource();
    node.connect(this.#audioContext.destination);
    node.buffer = audioBuffer;
    const start = Math.max(this.#nextStartTime || 0, this.#audioContext.currentTime + bufferSize / sampleRate);
    node.start(start);
    this.#nextStartTime = start + bufferSize / sampleRate;
  };

  #initNes = async () => {
    if (!configure.openNesFile) return;

    const ctx = this.canvasRef.element!.getContext('2d')!;
    this.#imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);

    const buffer = await configure.openNesFile.arrayBuffer();

    await init();
    this.#nes = Nes.new(48000, 800, 0.02);
    this.#nes.load_rom(new Uint8Array(buffer));
  };

  mounted = async () => {
    this.#audioContext = new AudioContext({ sampleRate: 48000 });
    requestAnimationFrame(this.#loop);
    this.effect(this.#initNes, () => [configure.openNesFile]);
    addEventListener('keydown', this.#onKeyDown);
    addEventListener('keyup', this.#onKeyUp);
  };

  unmounted = () => {
    this.#audioContext?.close();
    removeEventListener('keydown', this.#onKeyDown);
    removeEventListener('keyup', this.#onKeyUp);
  };

  render = () => {
    return html`
      <canvas class="canvas" width="256" height="240" ref=${this.canvasRef.ref}></canvas>
      <div class="nodata" ?hidden=${!!configure.openNesFile}>
        <dy-heading lv="1">${locale.noData}</dy-heading>
      </div>
    `;
  };
}
