import { Nes as ONes, Button, Player } from '@mantou/nes';
import { encodeQoiFrame, decodeQoiFrame } from '@mantou/nes-sandbox';
import init, { FceuxModule } from '@mantou/fceux';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import wasmURL from '@mantou/fceux/fceux.wasm?url';

import { Controllers } from './input';

export class Nes implements ONes {
  static new(_outputSampleRate: number) {
    return new Nes();
  }

  #width = 256;
  #height = 240;
  #currentDeQoiLen = 0;
  #currentQoiFrameLen = 0;
  #controllers = new Controllers();
  #sound = false;

  #frameNum = 0;
  #framePixelCount = this.#width * this.#height;
  #frameLen = this.#framePixelCount * 4;
  #frameSpace = [0, this.#frameLen - 1];

  // first 4 byte is qoi length
  #qoiLen = this.#frameLen;
  #qoiSpace = [this.#frameSpace[1] + 1, this.#frameSpace[1] + this.#qoiLen];
  #deQoiLen = this.#frameLen;
  #deQoiSpace = [this.#qoiSpace[1] + 1, this.#qoiSpace[1] + this.#deQoiLen];
  #mem = new Uint8Array(this.#deQoiSpace[1] + 1);

  #prevFrame = new Uint8ClampedArray();
  #fceux:
    | undefined
    | (FceuxModule & {
        HEAP8: Uint8Array;
        ctx: WebGLRenderingContext;
        _audioBufferCallback: () => number;
        _getMemory: () => number;
        _readMemory: (addr: number) => number;
        _writeMemory: (addr: number, value: number) => void;
      }) = undefined;

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

  async load_rom(bytes: Uint8Array) {
    this.#frameNum = 0;
    this.#fceux =
      this.#fceux ||
      (await new Promise((res, rej) => {
        init({
          locateFile: (path: string, prefix: string) => {
            if (path === 'fceux.wasm') return wasmURL;
            return prefix + path;
          },
        }).then(res, rej);
      }));

    this.#fceux!.init('#webgl-ctx');
    this.#fceux!.loadGame(bytes);
  }
  clock_frame(): number {
    // NOT support 4 player
    this.#fceux!.setControllerBits(this.#controllers.getState(this.#frameNum));
    this.#fceux!.update();
    const gl = this.#fceux!.ctx;
    const currentFrame = new Uint8ClampedArray(this.#mem.buffer, this.#frameSpace[0], this.#frameLen);
    gl.readPixels(0, 0, this.#width, this.#height, gl.RGBA, gl.UNSIGNED_BYTE, currentFrame);
    return this.#frameNum++;
  }
  audio_callback(out: Float32Array) {
    if (!this.#sound) return;
    out.set(new Float32Array(this.#fceux!.HEAP8.buffer, this.#fceux!._audioBufferCallback(), out.length));
  }
  handle_button_event(player: Player, button: Button, pressed: boolean) {
    this.#controllers.handleEvent(player, button, pressed);
  }
  handle_motion_event(_player: Player, _x: number, _y: number, _dx: number, _dy: number) {
    //
  }
  state(): Uint8Array {
    this.#fceux!.saveState();
    const buf = Object.values(this.#fceux!.exportSaveFiles())[0];
    this.#fceux!.deleteSaveFiles();
    return buf;
  }
  load_state(state: Uint8Array) {
    this.#fceux!.saveState();
    const name = Object.keys(this.#fceux!.exportSaveFiles())[0];
    this.#fceux!.importSaveFiles({ [name]: state });
    this.#fceux!.loadState();
  }
  reset() {
    this.#fceux?.reset();
  }
  set_sound(enabled: boolean) {
    this.#sound = enabled;
  }
  sound(): boolean {
    return this.#sound;
  }
  ram_map(): Uint32Array {
    return new Uint32Array([0, 0x07ff, 0x6000, 0x7fff]);
  }
  ram(): Uint8Array {
    const ram = new Uint8Array(10 * 1024);
    const offset = this.#fceux!._getMemory();
    ram.set(new Uint8Array(this.#fceux!.HEAP8.buffer, offset, 2 * 1024));
    ram.set(new Uint8Array(this.#fceux!.HEAP8.buffer, offset + 0x6000, 8 * 1024), 2 * 1024);
    return ram;
  }
  read_ram(addr: number): number {
    return this.#fceux!._readMemory(addr);
  }
  write_ram(addr: number, val: number) {
    this.#fceux!._writeMemory(addr, val);
  }
  /**
   * @ignore
   */
  free() {
    // no body
  }
}
