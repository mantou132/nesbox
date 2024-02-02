import { isNotNullish } from 'duoyun-ui/lib/types';
import { Button, Player } from '@mantou/nes';
import { Toast } from 'duoyun-ui/elements/toast';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';

import { dispatchGlobalEvent, globalEvents } from 'src/constants';

// https://w3c.github.io/gamepad/#remapping
export enum GamepadBtnIndex {
  Up = 12,
  Left = 14,
  Down = 13,
  Right = 15,
  A = 0,
  TurboA = 1,
  B = 2,
  TurboB = 3,
  Select = 8,
  Start = 9,
  Reset = 16,
  FrontLeftTop = 4,
  FrontRightTop = 5,
  FrontLeftBottom = 6,
  FrontRightBottom = 7,
}

const buttonMap: Partial<Record<GamepadBtnIndex, Button>> = {
  [GamepadBtnIndex.Up]: Button.JoypadUp,
  [GamepadBtnIndex.Left]: Button.JoypadLeft,
  [GamepadBtnIndex.Down]: Button.JoypadDown,
  [GamepadBtnIndex.Right]: Button.JoypadRight,
  [GamepadBtnIndex.A]: Button.JoypadA,
  [GamepadBtnIndex.TurboA]: Button.JoypadTurboA,
  [GamepadBtnIndex.B]: Button.JoypadB,
  [GamepadBtnIndex.TurboB]: Button.JoypadTurboB,
  [GamepadBtnIndex.Select]: Button.Select,
  [GamepadBtnIndex.Start]: Button.Start,
  [GamepadBtnIndex.Reset]: Button.Reset,
};

const playerMap = [Player.One, Player.Two, Player.Three, Player.Four];

const pressedButton = new Set<GamepadBtnIndex>();

function dispatchReleaseEvent(index: GamepadBtnIndex, padIndex = 0) {
  const player = playerMap[padIndex];
  const btn = buttonMap[index];
  if (player === Player.One) dispatchGlobalEvent(globalEvents.RELEASE_HOST_BUTTON_INDEX, index);
  if (btn !== undefined) dispatchGlobalEvent(globalEvents.RELEASE_BUTTON, { player, btn });
}

function dispatchPressEvent(index: GamepadBtnIndex, padIndex = 0) {
  const player = playerMap[padIndex];
  const btn = buttonMap[index];
  if (player === Player.One) dispatchGlobalEvent(globalEvents.PRESS_HOST_BUTTON_INDEX, index);
  if (btn !== undefined) dispatchGlobalEvent(globalEvents.PRESS_BUTTON, { player, btn });
}

const AXES_LIMIT = 0.2;
function readGamepad() {
  const gamepads = navigator
    .getGamepads()
    .filter(isNotNullish)
    .filter((e) => e.connected);

  gamepads.forEach((gamepad, padIndex) => {
    const axesButtonMap: Record<number, GamepadButton | undefined> = {};
    if (gamepad.axes[0] > AXES_LIMIT) {
      axesButtonMap[GamepadBtnIndex.Right] = { pressed: true, touched: true, value: 1 };
    }
    if (gamepad.axes[0] < -AXES_LIMIT) {
      axesButtonMap[GamepadBtnIndex.Left] = { pressed: true, touched: true, value: 1 };
    }
    if (gamepad.axes[1] > AXES_LIMIT) {
      axesButtonMap[GamepadBtnIndex.Down] = { pressed: true, touched: true, value: 1 };
    }
    if (gamepad.axes[1] < -AXES_LIMIT) {
      axesButtonMap[GamepadBtnIndex.Up] = { pressed: true, touched: true, value: 1 };
    }

    gamepad.buttons.forEach((b, index) => {
      const button = axesButtonMap[index] || b;
      if (pressedButton.has(index)) {
        if (!button.pressed) {
          pressedButton.delete(index);
          dispatchReleaseEvent(index, padIndex);
        }
      } else {
        if (button.pressed) {
          pressedButton.add(index);
          dispatchPressEvent(index, padIndex);
        }
      }
    });
  });

  if (gamepads.length > 0) {
    window.requestAnimationFrame(readGamepad);
  }
}

export const listenerGamepad = () => {
  if ([...navigator.getGamepads()].find((e) => e?.connected)) {
    readGamepad();
  } else {
    addEventListener('gamepadconnected', () => {
      Toast.open('default', 'Gamepad connected!');
      readGamepad();
    });
  }
};

export const startKeyboardSimulation = () => {
  const map = Object.entries({
    // scroll
    w: GamepadBtnIndex.Up,
    a: GamepadBtnIndex.Left,
    s: GamepadBtnIndex.Down,
    d: GamepadBtnIndex.Right,
    // select/start
    f: GamepadBtnIndex.Select,
    h: GamepadBtnIndex.Start,
    // detail/switch
    j: GamepadBtnIndex.B,
    k: GamepadBtnIndex.A,
    space: GamepadBtnIndex.A,
    // exit
    4: GamepadBtnIndex.FrontLeftTop,
    // settings
    5: GamepadBtnIndex.FrontRightTop,
    // page/tab navigation
    6: GamepadBtnIndex.FrontLeftBottom,
    7: GamepadBtnIndex.FrontRightBottom,
  });
  addEventListener(
    'keydown',
    hotkeys(
      map.reduce(
        (p, [key, btn]) => Object.assign(p, { [key]: () => dispatchPressEvent(btn) }),
        {} as Record<string, () => void>,
      ),
    ),
  );
  addEventListener(
    'keyup',
    hotkeys(
      map.reduce(
        (p, [key, btn]) => Object.assign(p, { [key]: () => dispatchReleaseEvent(btn) }),
        {} as Record<string, () => void>,
      ),
    ),
  );
};
