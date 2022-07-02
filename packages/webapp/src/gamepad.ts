import { isNotNullish } from 'duoyun-ui/lib/types';
import { Button } from '@nesbox/nes';

import { events } from 'src/constants';

// https://w3c.github.io/gamepad/#remapping
const map1: Record<number, Button> = {
  0: Button.Joypad1A,
  1: Button.Joypad1A,
  2: Button.Joypad1B,
  3: Button.Joypad1B,
  8: Button.Select,
  9: Button.Start,
  12: Button.Joypad1Up,
  13: Button.Joypad1Down,
  14: Button.Joypad1Left,
  15: Button.Joypad1Right,
};

const map2: Record<number, Button> = {
  0: Button.Joypad2A,
  1: Button.Joypad2A,
  2: Button.Joypad2B,
  3: Button.Joypad2B,
  12: Button.Joypad2Up,
  13: Button.Joypad2Down,
  14: Button.Joypad2Left,
  15: Button.Joypad2Right,
};

const mapList = [map1, map2];

const pressedButton = new Set<number>();

function readGamepad() {
  const gamepads = navigator
    .getGamepads()
    .filter(isNotNullish)
    .filter((e) => e.connected);

  gamepads.forEach((gamepad, index) => {
    const map = mapList[index];
    if (!map) return;
    gamepad.buttons.forEach((button, index) => {
      if (!map[index]) return;
      if (pressedButton.has(index)) {
        if (!button.pressed) {
          pressedButton.delete(index);
          window.dispatchEvent(new CustomEvent(events.RELEASE_BUTTON, { detail: map[index] }));
        }
      } else {
        if (button.pressed) {
          pressedButton.add(index);
          window.dispatchEvent(new CustomEvent(events.PRESS_BUTTON, { detail: map[index] }));
        }
      }
    });
  });

  if (gamepads.length > 0) {
    window.requestAnimationFrame(readGamepad);
  }
}

export const listener = () => {
  if (
    navigator
      .getGamepads()
      .filter(isNotNullish)
      .filter((e) => e.connected).length > 0
  ) {
    readGamepad();
  } else {
    addEventListener('gamepadconnected', readGamepad);
  }
};
