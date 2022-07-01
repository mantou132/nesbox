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
import { Button, WasmNes } from 'nes_rust_wasm';
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

  #nes?: WasmNes;
  #imageData?: ImageData;
  #audioContext?: AudioContext;

  #enableAudio = () => {
    if (this.#audioContext?.state === 'suspended') {
      this.#audioContext.resume();
    }
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
    if (button !== Button.Reset) this.#enableAudio();
    this.#nes?.press_button(button);
  };

  #onKeyUp = (event: KeyboardEvent) => {
    const button = this.#getButton(event);
    if (!button) return;
    this.#nes?.release_button(button);
  };

  #renderCanvas = () => {
    if (this.isConnected) {
      requestAnimationFrame(this.#renderCanvas);
    }

    if (!this.#nes || !this.#imageData) return;
    this.#nes.step_frame();
    this.#nes.update_pixels(new Uint8Array(this.#imageData.data.buffer));
    this.canvasRef.element!.getContext('2d')!.putImageData(this.#imageData, 0, 0);
  };

  #initAudio = () => {
    this.#audioContext = new AudioContext({ sampleRate: 44100 });
    this.#audioContext.suspend();
    const scriptProcessor = this.#audioContext.createScriptProcessor(4096, 0, 1);
    scriptProcessor.connect(this.#audioContext.destination);
    scriptProcessor.onaudioprocess = (e) => {
      if (this.#isVisible) {
        const data = e.outputBuffer.getChannelData(0);
        this.#nes?.update_sample_buffer(data);
      }
    };
  };

  #initNes = async () => {
    if (!configure.openNesFile) return;

    const ctx = this.canvasRef.element!.getContext('2d')!;
    this.#imageData = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
    const buffer = await configure.openNesFile.arrayBuffer();
    this.#nes = WasmNes.new();
    this.#nes.set_rom(new Uint8Array(buffer));
    this.#nes.bootup();
  };

  mounted = async () => {
    this.#renderCanvas();
    this.#initAudio();
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
