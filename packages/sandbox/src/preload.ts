import { Button } from '@mantou/nes';

export function preload() {
  globalThis.nesbox = {
    _getVideoFrame: () => new Uint8ClampedArray(),
    _getAudioFrame: () => new Float32Array(),
    _getState: () => new Uint8Array(),
    _setState: (_state?: Uint8Array) => void 0,
    _width: 0,
    _height: 0,
    _control: {} as Record<Button, boolean>,
    _prevControl: {} as Record<Button, boolean>,

    buttons: {} as Record<keyof typeof Button, Button>,
    buttons1: {} as Record<string, Button>,
    buttons2: {} as Record<string, Button>,
    buttons3: {} as Record<string, Button>,
    buttons4: {} as Record<string, Button>,
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

    isTap(button?: Button) {
      return button
        ? !this._prevControl[button] && this._control[button]
        : Object.entries(this._control).some(([button, v]) => v && !this._prevControl[button as unknown as Button]);
    },

    isPressed(button?: Button) {
      return button ? this._control[button] : Object.values(this._control).includes(true);
    },
  };

  class SandboxConsole {
    _logs = [['log', 'NESBox Sandbox Loaded']];
    _log = (type: string, ...args: any[]) => {
      this._logs.push([
        type,
        args
          .map((e) => {
            if (e && typeof e === 'object') return JSON.stringify(e);
            return String(e);
          })
          .join(' '),
      ]);
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
  nesbox.buttons1 = {
    JoypadA: nesbox.buttons.Joypad1A,
    JoypadB: nesbox.buttons.Joypad1B,
    JoypadTurboA: nesbox.buttons.Joypad1TurboA,
    JoypadTurboB: nesbox.buttons.Joypad1TurboB,
    JoypadUp: nesbox.buttons.Joypad1Up,
    JoypadDown: nesbox.buttons.Joypad1Down,
    JoypadLeft: nesbox.buttons.Joypad1Left,
    JoypadRight: nesbox.buttons.Joypad1Right,
  };
  nesbox.buttons2 = {
    JoypadA: nesbox.buttons.Joypad2A,
    JoypadB: nesbox.buttons.Joypad2B,
    JoypadTurboA: nesbox.buttons.Joypad2TurboA,
    JoypadTurboB: nesbox.buttons.Joypad2TurboB,
    JoypadUp: nesbox.buttons.Joypad2Up,
    JoypadDown: nesbox.buttons.Joypad2Down,
    JoypadLeft: nesbox.buttons.Joypad2Left,
    JoypadRight: nesbox.buttons.Joypad2Right,
  };
  nesbox.buttons3 = {
    JoypadA: nesbox.buttons.Joypad3A,
    JoypadB: nesbox.buttons.Joypad3B,
    JoypadTurboA: nesbox.buttons.Joypad3TurboA,
    JoypadTurboB: nesbox.buttons.Joypad3TurboB,
    JoypadUp: nesbox.buttons.Joypad3Up,
    JoypadDown: nesbox.buttons.Joypad3Down,
    JoypadLeft: nesbox.buttons.Joypad3Left,
    JoypadRight: nesbox.buttons.Joypad3Right,
  };
  nesbox.buttons4 = {
    JoypadA: nesbox.buttons.Joypad4A,
    JoypadB: nesbox.buttons.Joypad4B,
    JoypadTurboA: nesbox.buttons.Joypad4TurboA,
    JoypadTurboB: nesbox.buttons.Joypad4TurboB,
    JoypadUp: nesbox.buttons.Joypad4Up,
    JoypadDown: nesbox.buttons.Joypad4Down,
    JoypadLeft: nesbox.buttons.Joypad4Left,
    JoypadRight: nesbox.buttons.Joypad4Right,
  };
}

export function setControl(button: Button, pressed: boolean) {
  if (pressed) {
    nesbox._control[button] = pressed;
  } else {
    delete nesbox._control[button];
  }
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
  Promise.resolve().then(() => {
    nesbox._prevControl = { ...nesbox._control };
  });
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
