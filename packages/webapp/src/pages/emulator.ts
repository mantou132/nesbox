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

import type { NesboxRenderElement } from 'src/elements/render';
import { configure, defaultKeybinding } from 'src/configure';
import { requestFrame } from 'src/utils';

import 'duoyun-ui/elements/heading';
import 'src/elements/render';

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
  @refobject canvasRef: RefObject<NesboxRenderElement>;

  get #isVisible() {
    return document.visibilityState === 'visible';
  }

  #nes?: Nes;
  #audioContext?: AudioContext;

  #enableAudio = () => {
    this.#nes?.set_sound(true);
  };

  #disableAudio = () => {
    this.#nes?.set_sound(false);
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
      this.#nes?.reset();
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

  #sampleRate = 44100;
  #bufferSize = this.#sampleRate / 60;
  #nextStartTime = 0;
  #loop = () => {
    if (!this.#nes || !this.#isVisible) return;
    this.#nes.clock_frame();

    const memory = Nes.memory();

    const framePtr = this.#nes.frame(false);
    const frameLen = this.#nes.frame_len();
    this.canvasRef.element!.paint(new Uint8Array(memory.buffer, framePtr, frameLen));

    if (!this.#nes.sound() || !this.#audioContext) return;
    const audioBuffer = this.#audioContext.createBuffer(1, this.#bufferSize, this.#sampleRate);
    this.#nes.audio_callback(audioBuffer.getChannelData(0));
    const node = this.#audioContext.createBufferSource();
    node.connect(this.#audioContext.destination);
    node.buffer = audioBuffer;
    const start = Math.max(
      this.#nextStartTime,
      this.#audioContext.currentTime + this.#bufferSize / this.#sampleRate / 1000,
    );
    node.start(start);
    this.#nextStartTime = start + this.#bufferSize / this.#sampleRate;
  };

  #initNes = async () => {
    if (!configure.openNesFile) return;
    await init();
    this.#nes = Nes.new(this.#sampleRate);

    const buffer = await configure.openNesFile.arrayBuffer();
    this.#nes.load_rom(new Uint8Array(buffer));
    this.#nextStartTime = 0;
  };

  mounted = () => {
    this.#audioContext = new AudioContext({ sampleRate: this.#sampleRate });
    this.effect(
      () => requestFrame(this.#loop),
      () => [],
    );
    this.effect(this.#initNes, () => [configure.openNesFile]);
    addEventListener('keydown', this.#onKeyDown);
    addEventListener('keyup', this.#onKeyUp);
    addEventListener('focus', this.#enableAudio);
    addEventListener('blur', this.#disableAudio);
    return () => {
      this.#audioContext?.close();
      removeEventListener('keydown', this.#onKeyDown);
      removeEventListener('keyup', this.#onKeyUp);
      removeEventListener('focus', this.#enableAudio);
      removeEventListener('blur', this.#disableAudio);
    };
  };

  render = () => {
    return html`
      <nesbox-render class="canvas" ref=${this.canvasRef.ref}></nesbox-render>
      <div class="nodata" ?hidden=${!!configure.openNesFile}>
        <dy-heading lv="1">${locale.noData}</dy-heading>
      </div>
    `;
  };
}
