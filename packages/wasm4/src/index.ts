import { Nes as ONes, Button, Player } from '@mantou/nes';
import { encodeQoiFrame, decodeQoiFrame } from '@mantou/nes-sandbox';
import {
  ADDR_GAMEPAD1,
  ADDR_MOUSE_BUTTONS,
  ADDR_MOUSE_X,
  ADDR_MOUSE_Y,
  BUTTON_DOWN,
  BUTTON_LEFT,
  BUTTON_RIGHT,
  BUTTON_UP,
  BUTTON_X,
  BUTTON_Z,
  HEIGHT,
  MOUSE_LEFT,
  MOUSE_RIGHT,
  PAUSE_REBOOTING,
  WIDTH,
  Runtime,
} from '@mantou/nes-wasm4';

function getPlayerIdx(player: Player) {
  switch (player) {
    case Player.One:
      return 0;
    case Player.Two:
      return 1;
    case Player.Three:
      return 2;
    case Player.Four:
      return 3;
  }
}

function getButtonBitFlag(button: Button) {
  switch (button) {
    case Button.JoypadTurboA:
      return BUTTON_X;
    case Button.JoypadA:
      return BUTTON_X;
    case Button.JoypadTurboB:
      return BUTTON_Z;
    case Button.JoypadB:
      return BUTTON_Z;
    case Button.JoypadLeft:
      return BUTTON_LEFT;
    case Button.JoypadRight:
      return BUTTON_RIGHT;
    case Button.JoypadUp:
      return BUTTON_UP;
    case Button.JoypadDown:
      return BUTTON_DOWN;
    case Button.PointerPrimary:
      return MOUSE_LEFT;
    case Button.PointerSecondary:
      return MOUSE_RIGHT;
    default:
      return 0;
  }
}

export class Wasm4 implements ONes {
  static new(_output_sample_rate: number): Wasm4 {
    return new Wasm4();
  }

  #runtime = new Runtime('');

  #frameNum = 0;
  #frameLen = WIDTH * HEIGHT * 4;
  #frameSpace = [0, this.#frameLen - 1];
  #qoiLen = this.#frameLen;
  #qoiSpace = [this.#frameSpace[1] + 1, this.#frameSpace[1] + this.#qoiLen];
  #deQoiLen = this.#frameLen;
  #deQoiSpace = [this.#qoiSpace[1] + 1, this.#qoiSpace[1] + this.#deQoiLen];
  #mem = new Uint8Array(this.#deQoiSpace[1] + 1);

  #prevFrame = new Uint8ClampedArray();
  #currentQoiFrameLen = 0;
  #currentDeQoiLen = 0;
  #ready = false;
  #sound = false;

  mem(): Uint8Array {
    return this.#mem;
  }
  width() {
    return WIDTH;
  }
  height() {
    return HEIGHT;
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
    return this.#frameLen;
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
    if (!this.#ready) await this.#runtime.init();
    await this.#runtime.load(bytes);
    this.#runtime.start();
  }
  clock_frame(): number {
    this.#runtime.update();
    this.#runtime.composite();
    const { gl } = this.#runtime.compositor;
    const currentFrame = new Uint8ClampedArray(this.#mem.buffer, this.#frameSpace[0], this.#frameLen);
    gl.readPixels(0, 0, WIDTH, HEIGHT, this.#runtime.compositor.gl.RGBA, gl.UNSIGNED_BYTE, currentFrame);
    return this.#frameNum++;
  }
  audio_callback(out: Float32Array) {
    if (!this.#sound) return;
    const left = new Float32Array(out.length);
    const right = new Float32Array(out.length);
    this.#runtime.apu.process([[]], [[left, right]], {});
    for (let i = 0; i < out.length; i++) {
      out[i] = (left[i] + right[i]) / 2;
    }
  }
  handle_button_event(player: Player, button: Button, pressed: boolean) {
    if (button === Button.Start && pressed) {
      switch (this.#runtime.pauseState) {
        case 0:
          this.#runtime.pauseState = PAUSE_REBOOTING;
          return;
        case PAUSE_REBOOTING:
          this.#runtime.pauseState = 0;
          return;
      }
    }
    const x = this.#runtime.data.getInt16(ADDR_MOUSE_X, true);
    const y = this.#runtime.data.getInt16(ADDR_MOUSE_Y, true);
    const btn = getButtonBitFlag(button);
    const playerIdx = getPlayerIdx(player);
    const mouseButtons = this.#runtime.data.getUint8(ADDR_MOUSE_BUTTONS);
    const buttons = this.#runtime.data.getUint8(ADDR_GAMEPAD1 + playerIdx);

    if (button === Button.PointerPrimary || button === Button.PointerSecondary) {
      this.#runtime.setMouse(x, y, pressed ? mouseButtons | btn : mouseButtons & ~btn);
      return;
    }
    this.#runtime.setGamepad(playerIdx, pressed ? buttons | btn : buttons & ~btn);
  }
  handle_motion_event(_player: Player, x: number, y: number, _dx: number, _dy: number) {
    this.#runtime.setMouse(x, y, 0);
  }
  state(): Uint8Array {
    return new Uint8Array(this.#runtime.memory.buffer);
  }
  load_state(state: Uint8Array) {
    new Uint8Array(this.#runtime.memory.buffer).set(state);
  }
  async reset() {
    const wasmBuffer = this.#runtime.wasmBuffer;
    if (wasmBuffer) {
      this.#runtime.reset(true);
      this.#runtime.pauseState = PAUSE_REBOOTING;
      await this.#runtime.load(wasmBuffer);
      this.#runtime.pauseState = 0;
      this.#runtime.start();
    }
  }
  set_sound(enabled: boolean) {
    this.#sound = enabled;
  }
  sound(): boolean {
    return this.#sound;
  }
  ram_map(): Uint32Array {
    const lastArea = this.#runtime.framebuffer.bytes;
    return new Uint32Array([lastArea.byteOffset + lastArea.length, 0xffff]);
  }
  ram(): Uint8Array {
    const lastArea = this.#runtime.framebuffer.bytes;
    return new Uint8Array(this.#runtime.data.buffer, lastArea.byteOffset + lastArea.length);
  }
  read_ram(addr: number): number {
    return this.#runtime.data.getUint8(addr);
  }
  write_ram(addr: number, val: number) {
    return this.#runtime.data.setUint8(addr, val);
  }
  /**
   * @ignore
   */
  free() {
    // no body
  }
}
