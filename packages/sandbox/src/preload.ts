import { Button } from '@mantou/nes';

export function preload() {
  globalThis.nesbox = {
    _getVideoFrame: () => new Uint8ClampedArray(),
    _getAudioFrame: () => new Float32Array(),
    _getState: () => new Uint8Array(),
    _setState: (_state?: Uint8Array) => void 0,
    _width: 0,
    _height: 0,

    buttons: {} as Record<keyof typeof Button, Button>,
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

  class SandboxConsole {
    _logs = [['log', 'NESBox Sandbox Loaded']];
    _log = (type: string, ...args: any[]) => {
      this._logs.push([type, args.map((e) => String(e)).join(' ')]);
    };
  }

  globalThis.console = new Proxy(new SandboxConsole() as Console & SandboxConsole, {
    get(target, type: keyof (Console & SandboxConsole)) {
      return target[type] || target._log.bind(target, type);
    },
  });
}

export function getLogs(): string | undefined {
  return (globalThis.console as any)._logs.shift()?.join(',');
}

export function definedButtons(json: string) {
  nesbox.buttons = JSON.parse(json);
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
  return () => frame.getUint32(index++ * 4, false);
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
