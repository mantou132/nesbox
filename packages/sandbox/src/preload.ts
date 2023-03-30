/// Execute code in the vm
/// should not import any external functions

import type { Button, Player } from '@mantou/nes';

export function preload() {
  globalThis.nesbox = {
    _getVideoFrame: () => new Uint8ClampedArray(),
    _getAudioFrame: () => new Float32Array(),
    _getState: () => new Uint8Array(),
    _setState: (_state?: Uint8Array) => void 0,
    _width: 0,
    _height: 0,
    _control: new Proxy({} as Record<Player, { tap: Set<Button>; pressed: Set<Button> }>, {
      get(target, p) {
        const player = p as unknown as Player;
        if (!target[player]) {
          target[player] = { tap: new Set(), pressed: new Set() };
        }
        return target[player];
      },
    }),

    buttons: {} as Record<keyof typeof Button, Button>,
    players: {} as Record<keyof typeof Player, Player>,
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

    isTap(player: Player, button?: Button | Button[]) {
      const { tap } = this._control[player];
      return button ? (Array.isArray(button) ? button.some((e) => tap.has(e)) : tap.has(button)) : !!tap.size;
    },

    isPressed(player: Player, button?: Button | Button[]) {
      const { pressed } = this._control[player];
      return button
        ? Array.isArray(button)
          ? button.some((e) => pressed.has(e))
          : pressed.has(button)
        : !!pressed.size;
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
}

export function setControl(player: Player, button: Button, pressed: boolean) {
  const control = nesbox._control[player];
  if (pressed) {
    if (!control.pressed.has(button)) {
      control.tap.add(button);
    }
    control.pressed.add(button);
  } else {
    control.pressed.delete(button);
    control.tap.delete(button);
  }
}

export function setSound(enabled: boolean) {
  nesbox.soundEnabled = enabled;
}

export function setVideoFilter(filter: 'default' | 'NTSC') {
  nesbox.videoFilter = filter;
}

export function getVideoFrame() {
  const frame = nesbox._getVideoFrame();
  Promise.resolve().then(() => Object.values(nesbox._control).forEach(({ tap }) => tap.clear()));
  return frame;
  // const frame = new DataView(nesbox._getVideoFrame().buffer);
  // Promise.resolve().then(() => Object.values(nesbox._control).forEach(({ tap }) => tap.clear()));
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
