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
        currentOutputBuffer: Float32Array;
        _audioBufferCallback: () => void;
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
    this.#fceux!.update();
    const gl = this.#fceux!.ctx;
    const currentFrame = new Uint8ClampedArray(this.#mem.buffer, this.#frameSpace[0], this.#frameLen);
    gl.readPixels(0, 0, this.#width, this.#height, gl.RGBA, gl.UNSIGNED_BYTE, currentFrame);
    return this.#frameNum++;
  }
  audio_callback(out: Float32Array) {
    this.#fceux!.currentOutputBuffer = out;
    this.#fceux!._audioBufferCallback();
  }
  handle_button_event(player: Player, button: Button, pressed: boolean) {
    if (button === Button.JoypadTurboA || button === Button.JoypadTurboB || button === Button.JoypadTurboC) {
      this.#fceux?.setThrottling(pressed);
    }
    this.#controllers.handleEvent(player, button, pressed);
    // NOT support 4 player
    this.#fceux?.setControllerBits(this.#controllers.getState());
  }
  handle_motion_event(_player: Player, _x: number, _y: number, _dx: number, _dy: number) {
    //
  }
  state(): Uint8Array {
    this.#fceux!.saveState();
    const [name, buf] = Object.entries(this.#fceux!.exportSaveFiles())[0];
    const state = new Uint8Array(30 + buf.length);
    const nameBuf = new TextEncoder().encode(name);
    state[0] = nameBuf.length;
    state.set(nameBuf, 1);
    state.set(buf, 30);
    return state;
  }
  load_state(state: Uint8Array) {
    const name = new TextDecoder().decode(new Uint8Array(state.buffer, 1, state[0]));
    this.#fceux!.importSaveFiles({ [name]: new Uint8Array(state.buffer, 30) });
    this.#fceux!.loadState();
  }
  reset() {
    this.#fceux?.reset();
  }
  set_sound(enabled: boolean) {
    this.#fceux?.setMuted(!enabled);
  }
  sound(): boolean {
    return !this.#fceux?.muted();
  }
  /**
   * @ignore
   */
  ram_map(): Uint32Array {
    return new Uint32Array();
  }
  /**
   * @ignore
   */
  ram(): Uint8Array {
    return new Uint8Array();
  }
  /**
   * @ignore
   */
  read_ram(_addr: number): number {
    return 0;
  }
  /**
   * @ignore
   */
  write_ram(_addr: number, _val: number) {
    //
  }
  /**
   * @ignore
   */
  free() {
    // no body
  }
}
