import {
  adoptedStyle,
  connectStore,
  createRef,
  createState,
  css,
  customElement,
  effect,
  GemElement,
  history,
  html,
  mounted,
} from '@mantou/gem';
import { Button, type Nes, Player } from '@mantou/nes';
import { Modal } from 'duoyun-ui/elements/modal';
import { createPath, type RouteItem } from 'duoyun-ui/elements/route';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { locale } from 'duoyun-ui/lib/locale';
import { clamp } from 'duoyun-ui/lib/number';
import { configure, defaultKeybinding, setNesFile } from 'src/configure';
import type { NesboxCanvasElement } from 'src/elements/canvas';
import { routes } from 'src/routes';
import { createGame, mapPointerButton, positionMapping, requestFrame, watchDevRom } from 'src/utils/game';

import 'duoyun-ui/elements/heading';
import 'duoyun-ui/elements/link';
import 'duoyun-ui/elements/button';
import 'src/elements/canvas';

const style = css`
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
`;

@customElement('p-emulator')
@adoptedStyle(style)
@connectStore(configure)
export class PEmulatorElement extends GemElement {
  #canvasRef = createRef<NesboxCanvasElement>();

  #state = createState({
    canvasWidth: 0,
    canvasHeight: 0,
    rotate: false,
  });

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

  #getGamepadButton = (event: KeyboardEvent | PointerEvent) => {
    const map: Record<string, Button> = {
      [defaultKeybinding.Up]: Button.JoypadUp,
      [defaultKeybinding.Left]: Button.JoypadLeft,
      [defaultKeybinding.Down]: Button.JoypadDown,
      [defaultKeybinding.Right]: Button.JoypadRight,
      [defaultKeybinding.A]: Button.JoypadA,
      [defaultKeybinding.B]: Button.JoypadB,
      [defaultKeybinding.C]: Button.JoypadC,
      [defaultKeybinding.TurboA]: Button.JoypadTurboA,
      [defaultKeybinding.TurboB]: Button.JoypadTurboB,
      [defaultKeybinding.TurboC]: Button.JoypadTurboC,
      [defaultKeybinding.Select]: Button.Select,
      [defaultKeybinding.Start]: Button.Start,
      [defaultKeybinding.Reset]: Button.Reset,
    };
    const map2: Record<string, Button> = {
      [defaultKeybinding.Up_2]: Button.JoypadUp,
      [defaultKeybinding.Left_2]: Button.JoypadLeft,
      [defaultKeybinding.Down_2]: Button.JoypadDown,
      [defaultKeybinding.Right_2]: Button.JoypadRight,
      [defaultKeybinding.A_2]: Button.JoypadA,
      [defaultKeybinding.B_2]: Button.JoypadB,
      [defaultKeybinding.C_2]: Button.JoypadC,
      [defaultKeybinding.TurboA_2]: Button.JoypadTurboA,
      [defaultKeybinding.TurboB_2]: Button.JoypadTurboB,
      [defaultKeybinding.TurboC_2]: Button.JoypadTurboC,
    };
    if (event instanceof PointerEvent) {
      const btn = mapPointerButton(event);
      return btn && { player: Player.One, btn };
    }
    const key = event.key.toLowerCase();
    if (key in map2) {
      return { player: Player.Two, btn: map2[key] };
    }
    if (key in map) {
      return { player: Player.One, btn: map[key] };
    }
  };

  #onPointerMove = (event: PointerEvent) => {
    if (!this.#game) return;
    const [x, y, dx, dy] = positionMapping(event, this.#canvasRef.value!);
    this.#game.handle_motion_event(Player.One, x, y, dx, dy);
  };

  #quit = async () => {
    await Modal.confirm('Back to Games');
    history.replace({ path: createPath(routes.login) });
  };

  #onKeyDown = (event: KeyboardEvent) => {
    const button = this.#getGamepadButton(event);
    if (!button) {
      hotkeys({ esc: this.#quit })(event);
      return;
    }
    if (event.repeat) return;
    if (button.btn === Button.Reset) {
      this.#game?.reset();
    } else {
      this.#enableAudio();
    }
    this.#game?.handle_button_event(button.player, button.btn, true);
  };

  #onPointerDown = (event: PointerEvent) => {
    const button = this.#getGamepadButton(event);
    if (!button) return;
    this.#enableAudio();
    const [x, y, dx, dy] = positionMapping(event, this.#canvasRef.value!);
    this.#game?.handle_motion_event(Player.One, x, y, dx, dy);
    this.#game?.handle_button_event(Player.One, button.btn, true);
  };

  #onKeyOrPointerUp = (event: KeyboardEvent | PointerEvent) => {
    const button = this.#getGamepadButton(event);
    if (!button) return;
    if (event instanceof KeyboardEvent && event.repeat) return;
    this.#game?.handle_button_event(button.player, button.btn, false);
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
    this.#canvasRef.value!.paint(new Uint8Array(memory.buffer, framePtr, frameLen));

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

  @effect(() => [configure.openNesFile])
  #loadRom = async () => {
    if (!configure.openNesFile) return;

    this.#game = await createGame(
      configure.openNesFile.name,
      await configure.openNesFile.arrayBuffer(),
      this.#sampleRate,
    );

    this.#state({
      canvasWidth: this.#game.width(),
      canvasHeight: this.#game.height(),
      rotate: this.#game.rotate(),
    });

    this.#nextStartTime = 0;
  };

  @effect()
  #frame = () => requestFrame(this.#loop);

  @effect(() => [configure.windowHasFocus])
  #updateAudio = () => (configure.windowHasFocus ? this.#enableAudio() : this.#disableAudio());

  @mounted()
  #init = () => {
    this.#audioContext = new AudioContext({ sampleRate: this.#sampleRate });

    this.addEventListener('pointermove', this.#onPointerMove);
    addEventListener('keydown', this.#onKeyDown);
    this.addEventListener('pointerdown', this.#onPointerDown);
    addEventListener('keyup', this.#onKeyOrPointerUp);
    this.addEventListener('pointerup', this.#onKeyOrPointerUp);
    return () => {
      this.#audioContext?.close();
      this.removeEventListener('pointermove', this.#onPointerMove);
      removeEventListener('keydown', this.#onKeyDown);
      this.removeEventListener('pointerdown', this.#onPointerDown);
      removeEventListener('keyup', this.#onKeyOrPointerUp);
      this.removeEventListener('pointerup', this.#onKeyOrPointerUp);
    };
  };

  render = () => {
    const { canvasWidth, canvasHeight, rotate } = this.#state;

    return html`
      <nesbox-canvas
        ${this.#canvasRef}
        class="canvas"
        .width=${canvasWidth}
        .height=${canvasHeight}
        .rotate=${rotate}
      ></nesbox-canvas>
      <div class="nodata" ?hidden=${!!configure.openNesFile}>
        <dy-heading lv="1">${locale.noData}</dy-heading>
        <dy-link .route=${routes.games as RouteItem}><dy-button>Back to Games</dy-button></dy-link>
      </div>
    `;
  };
}

watchDevRom((rom) => setNesFile(new File([rom.romBuffer], rom.filename)));
