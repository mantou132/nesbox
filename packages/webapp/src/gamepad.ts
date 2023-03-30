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
  if (btn && player) dispatchGlobalEvent(globalEvents.RELEASE_BUTTON, { detail: { player, btn } });
}

function dispatchPressEvent(index: GamepadBtnIndex, padIndex = 0) {
  const player = playerMap[padIndex];
  const btn = buttonMap[index];
  if (player === Player.One) dispatchGlobalEvent(globalEvents.PRESS_HOST_BUTTON_INDEX, index);
  if (btn && player) dispatchGlobalEvent(globalEvents.PRESS_BUTTON, { player, btn });
}

function readGamepad() {
  const gamepads = navigator
    .getGamepads()
    .filter(isNotNullish)
    .filter((e) => e.connected);

  gamepads.forEach((gamepad, padIndex) => {
    gamepad.buttons.forEach((button, index) => {
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

export const listener = () => {
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
  addEventListener(
    'keydown',
    hotkeys({
      // scroll
      w: () => dispatchPressEvent(GamepadBtnIndex.Up),
      a: () => dispatchPressEvent(GamepadBtnIndex.Left),
      s: () => dispatchPressEvent(GamepadBtnIndex.Down),
      d: () => dispatchPressEvent(GamepadBtnIndex.Right),
      // select/switch
      j: () => dispatchPressEvent(GamepadBtnIndex.B),
      k: () => dispatchPressEvent(GamepadBtnIndex.A),
      space: () => dispatchPressEvent(GamepadBtnIndex.A),
      // back
      4: () => dispatchPressEvent(GamepadBtnIndex.FrontLeftTop),
      // foreword
      5: () => dispatchPressEvent(GamepadBtnIndex.FrontRightTop),
      // page/tab navigation
      6: () => dispatchPressEvent(GamepadBtnIndex.FrontLeftBottom),
      7: () => dispatchPressEvent(GamepadBtnIndex.FrontRightBottom),
    }),
  );
  addEventListener(
    'keyup',
    hotkeys({
      w: () => dispatchReleaseEvent(GamepadBtnIndex.Up),
      a: () => dispatchReleaseEvent(GamepadBtnIndex.Left),
      s: () => dispatchReleaseEvent(GamepadBtnIndex.Down),
      d: () => dispatchReleaseEvent(GamepadBtnIndex.Right),
      j: () => dispatchReleaseEvent(GamepadBtnIndex.B),
      k: () => dispatchReleaseEvent(GamepadBtnIndex.A),
      space: () => dispatchReleaseEvent(GamepadBtnIndex.A),
      4: () => dispatchReleaseEvent(GamepadBtnIndex.FrontLeftTop),
      5: () => dispatchReleaseEvent(GamepadBtnIndex.FrontRightTop),
      6: () => dispatchReleaseEvent(GamepadBtnIndex.FrontLeftBottom),
      7: () => dispatchReleaseEvent(GamepadBtnIndex.FrontRightBottom),
    }),
  );
};
