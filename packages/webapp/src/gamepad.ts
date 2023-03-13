import { isNotNullish } from 'duoyun-ui/lib/types';
import { Button } from '@mantou/nes';
import { Toast } from 'duoyun-ui/elements/toast';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';

import { events } from 'src/constants';

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

const buttonMap: Partial<Record<GamepadBtnIndex, Button[]>> = {
  [GamepadBtnIndex.Up]: [Button.Joypad1Up, Button.Joypad2Up, Button.Joypad3Up, Button.Joypad4Up],
  [GamepadBtnIndex.Left]: [Button.Joypad1Left, Button.Joypad2Left, Button.Joypad3Left, Button.Joypad4Left],
  [GamepadBtnIndex.Down]: [Button.Joypad1Down, Button.Joypad2Down, Button.Joypad3Down, Button.Joypad4Down],
  [GamepadBtnIndex.Right]: [Button.Joypad1Right, Button.Joypad2Right, Button.Joypad3Right, Button.Joypad4Right],
  [GamepadBtnIndex.A]: [Button.Joypad1A, Button.Joypad2A, Button.Joypad3A, Button.Joypad4A],
  [GamepadBtnIndex.TurboA]: [Button.Joypad1TurboA, Button.Joypad2TurboA, Button.Joypad3TurboA, Button.Joypad4TurboA],
  [GamepadBtnIndex.B]: [Button.Joypad1B, Button.Joypad2B, Button.Joypad3B, Button.Joypad4B],
  [GamepadBtnIndex.TurboB]: [Button.Joypad1TurboB, Button.Joypad2TurboB, Button.Joypad3TurboB, Button.Joypad4TurboB],
  [GamepadBtnIndex.Select]: [Button.Select],
  [GamepadBtnIndex.Start]: [Button.Start],
  [GamepadBtnIndex.Reset]: [Button.Reset],
};

const pressedButton = new Set<GamepadBtnIndex>();

function dispatchReleaseEvent(index: GamepadBtnIndex, padIndex = 0) {
  const btn = buttonMap[index]?.[padIndex];
  dispatchEvent(new CustomEvent(events.RELEASE_BUTTON_INDEX, { detail: index }));
  if (btn) dispatchEvent(new CustomEvent(events.RELEASE_BUTTON, { detail: btn }));
}

function dispatchPressEvent(index: GamepadBtnIndex, padIndex = 0) {
  const btn = buttonMap[index]?.[padIndex];
  dispatchEvent(new CustomEvent(events.PRESS_BUTTON_INDEX, { detail: index }));
  if (btn) dispatchEvent(new CustomEvent(events.PRESS_BUTTON, { detail: btn }));
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
