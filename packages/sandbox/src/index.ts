import { Nes as ONes, Button } from '@mantou/nes';
import QOI from 'qoijs';
import ShadowRealm from 'shadowrealm-api';

import { utf8ToBase64 } from './utils';
import { example } from './example';
import {
  preload,
  getAudioFrame,
  getState,
  getVideoFrame,
  setState,
  setControl,
  reset,
  getWidth,
  getHeight,
  setSound,
  setVideoFilter,
  definedButtons,
} from './preload';

export { Button };

export default async function () {
  // no body
}

export class Nes implements ONes {
  static memory() {
    throw new Error();
  }
  static new(_outputSampleRate: number) {
    return new Nes();
  }

  #frameNum = 0;
  #mem = new Uint8Array();
  #frameLen = 0;
  #frameSpace: number[] = [];
  #qoiLen = 0;
  #qoiSpace: number[] = [];
  #deQoiLen = 0;
  #deQoiSpace: number[] = [];

  mem(): Uint8Array {
    return this.#mem;
  }
  width() {
    return 0;
  }
  height() {
    return 0;
  }
  frame(qoi: boolean, _fullEncode: boolean): number {
    if (qoi) {
      const buffer = QOI.encode(new Uint8Array(this.#mem.buffer, this.#frameSpace[0], this.#frameLen), {
        width: this.width(),
        height: this.height(),
        channels: 4,
        colorspace: 0,
      });
      new Uint32Array(this.#mem.buffer, this.#qoiSpace[0], 1)[0] = buffer.byteLength;
      new Uint8Array(this.#mem.buffer, this.#qoiSpace[0] + 4, this.#qoiLen - 4).set(new Uint8Array(buffer));
    }
    return this.#frameSpace[0];
  }
  frame_len(): number {
    return this.#frameLen;
  }
  qoi_frame(): number {
    return this.#qoiSpace[0] + 4;
  }
  qoi_frame_len(): number {
    return new Uint32Array(this.#mem.buffer, this.#qoiSpace[0], 1)[0];
  }
  decode_qoi(bytes: Uint8Array): number {
    new Uint8Array(this.#mem.buffer, this.#deQoiSpace[0], this.#deQoiLen).set(
      new Uint8Array(QOI.decode(bytes.buffer).data),
    );
    return this.#deQoiSpace[0];
  }
  decode_qoi_len(): number {
    return this.#deQoiLen;
  }

  async load_rom(bytes: Uint8Array) {
    this.#frameNum = 0;
    const realm = new ShadowRealm();
    realm.evaluate(`(${preload.toString()})()`);
    const importList = [
      getAudioFrame,
      getState,
      getVideoFrame,
      setState,
      setControl,
      reset,
      getWidth,
      getHeight,
      setSound,
      setVideoFilter,
      definedButtons,
    ] as const;
    return Promise.all(
      importList.map((fn) => {
        const url = `data:text/javascript;base64,${utf8ToBase64(`export ${fn.toString()}`)}`;
        return realm.importValue(url, fn.name);
      }),
    ).then(async (list) => {
      const [
        getAudioFrame,
        getState,
        getVideoFrame,
        setState,
        setControl,
        reset,
        getWidth,
        getHeight,
        setSound,
        setVideoFilter,
        definedButtons,
      ] = list as unknown as typeof importList;

      definedButtons(JSON.stringify(Button));

      // nesbox init
      // realm.evaluate(`(${example.toString()})()`);
      realm.evaluate(new TextDecoder().decode(bytes));

      this.clock_frame = () => {
        const fn = getVideoFrame();
        const frame = new DataView(this.#mem.buffer, this.#frameSpace[0], this.#frameLen);
        for (let i = 0; i < this.#frameLen; i += 8) {
          frame.setBigUint64(i, fn() || 0n, false);
        }
        return ++this.#frameNum;
      };
      this.audio_callback = (out: Float32Array) => {
        const fn = getAudioFrame();
        for (let i = 0; i < out.length; i++) {
          out[i] = fn() || 0;
        }
      };
      this.handle_event = (button, pressed, repeat) => {
        if (repeat) return false;
        return setControl(button, pressed);
      };
      this.state = () => {
        const fn = getState();
        const len = fn();
        if (len > 200 * 1024) throw new Error(`Too much memory`);
        return Uint8Array.from({ length: len }, () => fn());
      };
      this.load_state = (state: Uint8Array) => {
        const fn = setState(state.length);
        state.forEach((val) => fn(val));
      };
      this.reset = () => reset();
      this.width = () => getWidth();
      this.height = () => getHeight();
      this.set_filter = (filter: string) => {
        switch (filter) {
          case 'NTSC':
            setVideoFilter(filter);
            break;
          default:
            setVideoFilter('default');
        }
      };
      this.set_sound = (enabled) => setSound(enabled);

      const width = this.width();
      const height = this.height();
      if (width > 256 || height > 240 || (height * width) % 2) throw new Error('width or height mistake');

      this.#frameLen = width * height * 4;
      this.#frameSpace = [0, this.#frameLen - 1];

      // first 4 byte is qoi length
      this.#qoiLen = this.#frameLen;
      this.#qoiSpace = [this.#frameSpace[1] + 1, this.#frameSpace[1] + this.#qoiLen];

      this.#deQoiLen = this.#frameLen;
      this.#deQoiSpace = [this.#qoiSpace[1] + 1, this.#qoiSpace[1] + this.#deQoiLen];
      this.#mem = new Uint8Array(this.#deQoiSpace[1] + 1);
    });
  }
  clock_frame(): number {
    return 0;
  }
  audio_callback(_out: Float32Array) {
    //
  }
  handle_event(_button: Button, _pressed: boolean, _repeat: boolean): boolean {
    return false;
  }
  state(): Uint8Array {
    return new Uint8Array();
  }
  load_state(_state: Uint8Array) {
    //
  }
  reset() {
    //
  }
  set_filter(_filter: string) {
    //
  }
  set_sound(_enabled: boolean) {
    //
  }

  /**
   * @ignore
   */
  sound(): boolean {
    return true;
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
