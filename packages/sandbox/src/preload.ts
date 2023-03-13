import type { Button, Player } from '@mantou/nes';

export function preload() {
  globalThis.nesbox = {
    _getVideoFrame: () => new Uint8ClampedArray(),
    _getAudioFrame: () => new Float32Array(),
    _getState: () => new Uint8Array(),
    _setState: (_state?: Uint8Array) => void 0,
    _width: 0,
    _height: 0,
    _pressedControl: new Set(),
    _tapControl: new Set(),

    buttons: {} as Record<keyof typeof Button, Button>,
    players: {} as Record<keyof typeof Player, Player>,
    buttons1: {} as Record<string, Button>,
    buttons2: {} as Record<string, Button>,
    buttons3: {} as Record<string, Button>,
    buttons4: {} as Record<string, Button>,
    soundEnabled: true,
    videoFilter: 'default',
    cursorPosition: new Map(),

    init({ getAudioFrame, getState, getVideoFrame, setState, width, height }) {
      this._getVideoFrame = getVideoFrame;
      this._getAudioFrame = getAudioFrame;
      this._getState = getState;
      this._setState = setState;
      this._height = height;
      this._width = width;
    },

    isTap(button?: Button) {
      return button ? this._tapControl.has(button) : !!this._tapControl.size;
    },

    isPressed(button?: Button) {
      return button ? this._pressedControl.has(button) : !!this._pressedControl.size;
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

  globalThis.console =
    globalThis.console ||
    new Proxy(new SandboxConsole() as Console & SandboxConsole, {
      get(target, type: keyof (Console & SandboxConsole)) {
        return target[type] || target._log.bind(target, type);
      },
    });
}

export function getLogs(): string | undefined {
  return (globalThis.console as any)._logs?.shift()?.join(',');
}

export function setCursorPosition(player: Player, x: number, y: number) {
  nesbox.cursorPosition.set(player, { x, y });
}

export function definedEnums(json: string, playerJson: string) {
  nesbox.buttons = JSON.parse(json);
  nesbox.players = JSON.parse(playerJson);
  nesbox.buttons1 = {
    JoypadA: nesbox.buttons.Joypad1A,
    JoypadB: nesbox.buttons.Joypad1B,
    JoypadTurboA: nesbox.buttons.Joypad1TurboA,
    JoypadTurboB: nesbox.buttons.Joypad1TurboB,
    JoypadUp: nesbox.buttons.Joypad1Up,
    JoypadDown: nesbox.buttons.Joypad1Down,
    JoypadLeft: nesbox.buttons.Joypad1Left,
    JoypadRight: nesbox.buttons.Joypad1Right,
    PointerLeft: nesbox.buttons.Pointer1Left,
    PointerRight: nesbox.buttons.Pointer1Right,
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
    PointerLeft: nesbox.buttons.Pointer2Left,
    PointerRight: nesbox.buttons.Pointer2Right,
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
    PointerLeft: nesbox.buttons.Pointer3Left,
    PointerRight: nesbox.buttons.Pointer3Right,
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
    PointerLeft: nesbox.buttons.Pointer4Left,
    PointerRight: nesbox.buttons.Pointer4Right,
  };
}

export function setControl(button: Button, pressed: boolean) {
  if (pressed) {
    if (!nesbox._pressedControl.has(button)) {
      nesbox._tapControl.add(button);
    }
    nesbox._pressedControl.add(button);
  } else {
    nesbox._pressedControl.delete(button);
    nesbox._tapControl.delete(button);
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
  const frame = nesbox._getVideoFrame();
  Promise.resolve().then(() => nesbox._tapControl.clear());
  return frame;
  // const frame = new DataView(nesbox._getVideoFrame().buffer);
  // Promise.resolve().then(() => nesbox._tapControl.clear());
  // let index = 0;
  // return () => frame.getUint32(index++ * 4, false);
}

export function getAudioFrame() {
  // const frame = nesbox._getAudioFrame();
  // let index = 0;
  // return () => frame[index++];
  return nesbox._getAudioFrame();
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
