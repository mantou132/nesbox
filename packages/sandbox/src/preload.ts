import { Button } from '@mantou/nes';

export function preload() {
  globalThis.nesbox = {
    _getVideoFrame: () => new Uint8ClampedArray(),
    _getAudioFrame: () => new Float32Array(),
    _getState: () => new Uint8Array(),
    _setState: (_state?: Uint8Array) => void 0,
    _width: 0,
    _height: 0,

    control: {} as Record<Button, boolean>,
    soundEnabled: true,
    videoFilter: 'default',

    init({ getAudioFrame, getState, getVideoFrame, setState, width, height }) {
      this._getVideoFrame = getVideoFrame;
      this._getAudioFrame = getAudioFrame;
      this._getState = getState;
      this._setState = setState;
      this._height = height;
      this._width = width;
    },
  };
}

export function setControl(button: Button, pressed: boolean) {
  nesbox.control[button] = pressed;
  return true;
}

export function setSound(enabled: boolean) {
  nesbox.soundEnabled = enabled;
}

export function setVideoFilter(filter: 'default' | 'NTSC') {
  nesbox.videoFilter = filter;
}

export function getVideoFrame() {
  const frame = new DataView(nesbox._getVideoFrame().buffer);
  let index = 0;
  return () => frame.getBigUint64(index++ * 8, false);
}

export function getAudioFrame() {
  const frame = nesbox._getAudioFrame();
  let index = 0;
  return () => frame[index++];
}

export function getState() {
  const state = nesbox._getState();
  let index = 0;
  let lenReport = false;
  return () => {
    if (!lenReport) {
      lenReport = true;
      return state.length;
    }
    return state[index++];
  };
}

export function setState(length: number) {
  const state = new Uint8Array(length);
  let index = 0;
  return (value: number) => {
    state[index++] = value;
    if (index === length) {
      nesbox._setState(state);
    }
  };
}

export function reset() {
  nesbox._setState();
}

export function getWidth() {
  return nesbox._width;
}
export function getHeight() {
  return nesbox._height;
}
