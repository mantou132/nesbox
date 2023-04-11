/// <reference types="./types" />

import { Nes as ONes, Button, Player } from '@mantou/nes';
import { encodeQoiFrame, decodeQoiFrame } from '@mantou/nes-sandbox';
import init from '@mantou/fbneo/fbneo-arcade';
import wasmURL from '@mantou/fbneo/fbneo-arcade.wasm?url';

import { Controllers } from './input';

const INT16_MAX = 2 ** 15 - 1;

export class Arcade implements ONes {
  static new(_outputSampleRate: number) {
    return new Arcade();
  }

  #frameNum = 0;
  #mem = new Uint8Array();
  #frameLen = 0;
  #frameSpace: number[] = [];
  #qoiLen = 0;
  #qoiSpace: number[] = [];
  #deQoiLen = 0;
  #deQoiSpace: number[] = [];
  #prevFrame = new Uint8ClampedArray();
  #fbneo: undefined | Awaited<ReturnType<typeof init>> = undefined;

  #width = 0;
  #height = 0;
  #vidBits = 32;
  #sound = false;
  #currentDeQoiLen = 0;
  #currentQoiFrameLen = 0;
  #audioArray = new Int16Array();
  #controllers = new Controllers();
  #statePath = '';

  mem(): Uint8Array {
    return this.#mem;
  }
  width() {
    return this.#width;
  }
  height() {
    return this.#height;
  }
  frame(qoi: boolean, qoiWholeFrame: boolean): number {
    if (qoi) {
      const currentFrame = new Uint8ClampedArray(this.#mem.buffer, this.#frameSpace[0], this.#frameLen);
      const [qoiFrame, partArr] = encodeQoiFrame(this.#prevFrame, currentFrame, this.width(), qoiWholeFrame);
      if (qoiFrame.length + partArr.length <= this.#qoiLen) {
        this.#currentQoiFrameLen = qoiFrame.length + partArr.length;
        new Uint8Array(this.#mem.buffer, this.#qoiSpace[0], this.#qoiLen).set(qoiFrame);
        new Uint8Array(this.#mem.buffer, this.#qoiSpace[0] + qoiFrame.byteLength, partArr.length).set(partArr);
        this.#prevFrame = currentFrame.slice(0);
      }
    } else {
      this.#prevFrame = new Uint8ClampedArray();
    }
    return this.#frameSpace[0];
  }
  frame_len(): number {
    return (this.#width * this.#height) << 2;
  }
  qoi_frame(): number {
    return this.#qoiSpace[0];
  }
  qoi_frame_len(): number {
    return this.#currentQoiFrameLen;
  }
  decode_qoi(bytes: Uint8Array): number {
    const frame = decodeQoiFrame(bytes.buffer).data;
    this.#currentDeQoiLen = frame.length;
    new Uint8Array(this.#mem.buffer, this.#deQoiSpace[0], this.#deQoiLen).set(frame);
    return this.#deQoiSpace[0];
  }
  decode_qoi_len(): number {
    return this.#currentDeQoiLen;
  }
  async load_rom(bytes: Uint8Array, name = '') {
    this.#frameNum = 0;
    let resolve: (value: unknown) => void = () => void 0;
    const romReady = new Promise((res) => (resolve = res));
    this.#fbneo =
      this.#fbneo ||
      (await init({
        start: () => {
          this.#fbneo!.cwrap('startMain', 'number', ['string'])(name);
        },
        locateFile: (path, prefix) => {
          if (path === 'fbneo-arcade.wasm') return wasmURL;
          return prefix + path;
        },
        setRomProps: (w, h, rotateGame, flipped, vidImageDepth, _nBurnFPS, _aspectX, _aspectY) => {
          this.#width = w;
          this.#height = h;
          this.#vidBits = vidImageDepth;
          resolve(null);
        },
        setVisibleSize: (_pnWidth, _pnHeight) => {
          //
        },
        setAspectRatio: (_pnXAspect, _pnYAspect) => {
          //
        },
        audioCallback: (soundPtr, length) => {
          this.#audioArray = new Int16Array(this.#fbneo!.HEAP16.buffer, soundPtr, length);
        },
        drawScreen: (vidImagePtr) => {
          const currentFrame = new Uint8ClampedArray(this.#mem.buffer, this.#frameSpace[0], this.#frameLen);
          const pixelCount = this.#width * this.#height;
          if (this.#vidBits === 16) {
            const b = new Uint8Array(this.#fbneo!.HEAP8.buffer, vidImagePtr, pixelCount << 1);
            let index = 0;
            for (let i = 0; i < pixelCount; i++) {
              const offset = i << 1;
              const color = ((b[offset + 1] << 8) & 0xff00) | (b[offset] & 0xff);
              currentFrame[index++] = ((color >> 11) & 0x1f) << 3;
              currentFrame[index++] = ((color >> 5) & 0x3f) << 2;
              currentFrame[index++] = (color & 0x1f) << 3;
              currentFrame[index++] = 255;
            }
          } else {
            const b = new Uint8Array(this.#fbneo!.HEAP8.buffer, vidImagePtr, pixelCount << 2);
            let index = 0;
            for (let i = 0; i < pixelCount; i++) {
              const offset = i << 2;
              currentFrame[index++] = b[offset + 2];
              currentFrame[index++] = b[offset + 1];
              currentFrame[index++] = b[offset];
              currentFrame[index++] = 255;
            }
          }
        },
        addFile: (_RomName, _nType, _nRet) => {
          //
        },
        addInput: (_szName, _key) => {
          //
        },
        addArchive: (_szName, _szFullName, _bFound) => {
          //
        },
      }));

    // https://github.com/mantou132/FBNeo/blob/nesbox/src/burner/sdl/run.cpp#L109
    this.#statePath = `/libsdl/fbneo/states/${name}.fs.all`;
    this.#fbneo.FS.mkdir('roms');
    this.#fbneo.FS.writeFile('roms/' + name + '.zip', bytes);
    this.#fbneo.start();

    await romReady;

    this.#frameLen = this.#width * this.#height * 4;
    this.#frameSpace = [0, this.#frameLen - 1];

    // first 4 byte is qoi length
    this.#qoiLen = this.#frameLen;
    this.#qoiSpace = [this.#frameSpace[1] + 1, this.#frameSpace[1] + this.#qoiLen];

    this.#deQoiLen = this.#frameLen;
    this.#deQoiSpace = [this.#qoiSpace[1] + 1, this.#qoiSpace[1] + this.#deQoiLen];
    this.#mem = new Uint8Array(this.#deQoiSpace[1] + 1);

    this.#controllers = new Controllers();
  }
  clock_frame(): number {
    this.#fbneo!._collectGameInputs();
    this.#fbneo!._doLoop();
    return this.#frameNum++;
  }
  audio_callback(out: Float32Array) {
    if (!this.#sound) return;
    for (let i = 0; i < out.length; i++) {
      out[i] = (this.#audioArray[2 * i] + this.#audioArray[2 * i + 1]) / INT16_MAX / 2;
    }
  }
  handle_button_event(player: Player, button: Button, pressed: boolean) {
    const controller = this.#controllers.getController(player);
    controller.handleEvent(button, pressed);
    this.#fbneo?._setEmInput(...controller.getArgs());
  }
  handle_motion_event(_player: Player, _x: number, _y: number, _dx: number, _dy: number) {
    //
  }
  state(): Uint8Array {
    this.#fbneo!._saveAllState(1);
    return this.#fbneo!.FS.readFile(this.#statePath);
  }
  load_state(state: Uint8Array) {
    this.#fbneo!.FS.writeFile(this.#statePath, state);
    this.#fbneo!._saveAllState(0);
  }
  reset() {
    this.#fbneo!.start();
  }
  set_sound(enabled: boolean) {
    this.#sound = enabled;
  }
  sound(): boolean {
    return this.#sound;
  }
  ram_map(): Uint32Array {
    return new Uint32Array();
  }
  ram(): Uint8Array {
    const prt = this.#fbneo!._collectMemory();
    const len = this.#fbneo!._getMemorySize();
    return new Uint8Array(this.#fbneo!.HEAP8.buffer, prt, len).slice();
  }
  read_ram(addr: number): number {
    return this.#fbneo!._readMemory(addr);
  }
  write_ram(addr: number, val: number) {
    this.#fbneo!._writeMemory(addr, val);
  }
  /**
   * @ignore
   */
  free() {
    // no body
  }
}
