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
  history,
} from '@mantou/gem';
import { locale } from 'duoyun-ui/lib/locale';
import { default as initNes, Button, Nes, Player } from '@mantou/nes';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { clamp } from 'duoyun-ui/lib/number';
import { Modal } from 'duoyun-ui/elements/modal';
import { createPath, RouteItem } from 'duoyun-ui/elements/route';
import { positionMapping, requestFrame } from 'src/utils';
import { routes } from 'src/routes';

import { configure, defaultKeybinding, setNesFile } from 'src/configure';

import type { NesboxCanvasElement } from 'src/elements/canvas';

import 'duoyun-ui/elements/heading';
import 'duoyun-ui/elements/link';
import 'duoyun-ui/elements/button';
import 'src/elements/canvas';

const style = createCSSSheet(css`
  .canvas {
    position: absolute;
    width: 100%;
    height: 100%;
    background-color: black;
    image-rendering: pixelated;
  }
  .nodata {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    place-content: center;
    place-items: center;
    margin-block-start: -10vh;
  }
  .nodata[hidden] {
    display: none;
  }
`);

type State = {
  canvasWidth: number;
  canvasHeight: number;
};

/**
 * @customElement p-emulator
 */
@customElement('p-emulator')
@adoptedStyle(style)
@connectStore(configure)
export class PEmulatorElement extends GemElement<State> {
  @refobject canvasRef: RefObject<NesboxCanvasElement>;

  state: State = {
    canvasWidth: 0,
    canvasHeight: 0,
  };

  get #isVisible() {
    return document.visibilityState === 'visible';
  }

  #game?: Nes;
  #audioContext?: AudioContext;

  #enableAudio = () => {
    this.#game?.set_sound(true);
  };

  #disableAudio = () => {
    this.#game?.set_sound(false);
  };

  #getButton = (event: KeyboardEvent | PointerEvent) => {
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
    if (event instanceof MouseEvent) {
      switch (event.button) {
        case 0:
          return Button.Pointer1Left;
        case 2:
          return Button.Pointer1Right;
        default:
          return;
      }
    }
    return map[event.key.toLowerCase()];
  };

  #onPointerMove = (event: PointerEvent) => {
    if (!this.#game) return;
    const [x, y, dx, dy] = positionMapping(event, this.canvasRef.element!);
    this.#game.handle_motion_event(Player.One, x, y, dx, dy);
  };

  #quit = async () => {
    await Modal.confirm('Back to Games');
    history.replace({ path: createPath(routes.login) });
  };

  #onKeyDown = (event: KeyboardEvent) => {
    const button = this.#getButton(event);
    if (!button) {
      hotkeys({ esc: this.#quit })(event);
      return;
    }
    if (button === Button.Reset) {
      this.#game?.reset();
    } else {
      this.#enableAudio();
    }
    this.#game?.handle_button_event(button, true, event.repeat);
  };

  #onPointerDown = (event: PointerEvent) => {
    const button = this.#getButton(event);
    if (!button) return;
    this.#enableAudio();
    this.#game?.handle_button_event(button, true, false);
  };

  #onKeyOrPointerUp = (event: KeyboardEvent | PointerEvent) => {
    const button = this.#getButton(event);
    if (!button) return;
    this.#game?.handle_button_event(button, false, event instanceof KeyboardEvent ? event.repeat : false);
  };

  #sampleRate = 44100;
  #bufferSize = this.#sampleRate / 60;
  #nextStartTime = 0;
  #loop = () => {
    if (!this.#game || !this.#isVisible) return;
    this.#game.clock_frame();

    const memory = this.#game.mem();

    const framePtr = this.#game.frame(false, false);
    const frameLen = this.#game.frame_len();
    this.canvasRef.element!.paint(new Uint8Array(memory.buffer, framePtr, frameLen));

    if (!this.#game.sound() || !this.#audioContext) return;
    const audioBuffer = this.#audioContext.createBuffer(1, this.#bufferSize, this.#sampleRate);
    this.#game.audio_callback(audioBuffer.getChannelData(0));
    const node = this.#audioContext.createBufferSource();
    node.connect(this.#audioContext.destination);
    node.buffer = audioBuffer;
    const start = clamp(this.#audioContext.currentTime, this.#nextStartTime, this.#audioContext.currentTime + 4 / 60);
    node.start(start);
    this.#nextStartTime = start + 1 / 60;
  };

  #loadRom = async () => {
    if (!configure.openNesFile) return;

    const romBuffer = await configure.openNesFile.arrayBuffer();

    switch (configure.openNesFile.name.toLowerCase().split('.').pop()) {
      case 'wasm': {
        await initNes(new Response(romBuffer, { headers: { 'content-type': 'application/wasm' } }));
        this.#game = Nes.new(this.#sampleRate);
        break;
      }
      case 'js': {
        const { default: initNes, Nes } = await import('@mantou/nes-sandbox');
        await initNes();
        const jsGame = Nes.new(this.#sampleRate);
        await jsGame.load_rom(new Uint8Array(romBuffer));
        this.#game = jsGame;
        break;
      }
      default: {
        await initNes();
        this.#game = Nes.new(this.#sampleRate);
        this.#game.load_rom(new Uint8Array(romBuffer));
      }
    }

    this.setState({ canvasWidth: this.#game.width(), canvasHeight: this.#game.height() });

    this.#nextStartTime = 0;
  };

  mounted = () => {
    this.#audioContext = new AudioContext({ sampleRate: this.#sampleRate });
    this.effect(() => requestFrame(this.#loop));
    this.effect(this.#loadRom, () => [configure.openNesFile]);

    this.effect(
      () => (configure.windowHasFocus ? this.#enableAudio() : this.#disableAudio()),
      () => [configure.windowHasFocus],
    );

    addEventListener('pointermove', this.#onPointerMove);
    addEventListener('keydown', this.#onKeyDown);
    this.addEventListener('pointerdown', this.#onPointerDown);
    addEventListener('keyup', this.#onKeyOrPointerUp);
    this.addEventListener('pointerup', this.#onKeyOrPointerUp);
    return () => {
      this.#game?.free();
      this.#audioContext?.close();
      removeEventListener('pointermove', this.#onPointerMove);
      removeEventListener('keydown', this.#onKeyDown);
      this.removeEventListener('pointerdown', this.#onPointerDown);
      removeEventListener('keyup', this.#onKeyOrPointerUp);
      this.removeEventListener('pointerup', this.#onKeyOrPointerUp);
    };
  };

  render = () => {
    const { canvasWidth, canvasHeight } = this.state;

    return html`
      <nesbox-canvas
        class="canvas"
        ref=${this.canvasRef.ref}
        .width=${canvasWidth}
        .height=${canvasHeight}
      ></nesbox-canvas>
      <div class="nodata" ?hidden=${!!configure.openNesFile}>
        <dy-heading lv="1">${locale.noData}</dy-heading>
        <dy-link .route=${routes.games as RouteItem}><dy-button>Back to Games</dy-button></dy-link>
      </div>
    `;
  };
}

if (process.env.NODE_ENV === 'development') {
  (async function () {
    try {
      const gameOrigin = 'http://localhost:8000';
      let filename = 'index_bg.wasm';
      if (!(await fetch(`${gameOrigin}/${filename}`)).ok) {
        filename = 'index.js';
      }
      setNesFile(new File([await (await fetch(`${gameOrigin}/${filename}`)).blob()], filename));
      new EventSource(`${gameOrigin}/esbuild`).addEventListener('change', () => location.reload());
    } catch {
      //
    }
  })();
}
