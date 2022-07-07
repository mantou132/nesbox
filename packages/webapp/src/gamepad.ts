import { isNotNullish } from 'duoyun-ui/lib/types';
import { Button } from '@mantou/nes';

import { events } from 'src/constants';

// https://w3c.github.io/gamepad/#remapping
const buttonMap: Record<Button, Button[]> = {
  12: [Button.Joypad1Up, Button.Joypad2Up, Button.Joypad3Up, Button.Joypad4Up],
  14: [Button.Joypad1Left, Button.Joypad2Left, Button.Joypad3Left, Button.Joypad4Left],
  13: [Button.Joypad1Down, Button.Joypad2Down, Button.Joypad3Down, Button.Joypad4Down],
  15: [Button.Joypad1Right, Button.Joypad2Right, Button.Joypad3Right, Button.Joypad4Right],
  0: [Button.Joypad1A, Button.Joypad2A, Button.Joypad3A, Button.Joypad4A],
  1: [Button.Joypad1TurboA, Button.Joypad2TurboA, Button.Joypad3TurboA, Button.Joypad4TurboA],
  2: [Button.Joypad1B, Button.Joypad2B, Button.Joypad3B, Button.Joypad4B],
  3: [Button.Joypad1TurboB, Button.Joypad2TurboB, Button.Joypad3TurboB, Button.Joypad4TurboB],
  8: [Button.Select],
  9: [Button.Start],
  16: [Button.Reset],
};

const pressedButton = new Set<number>();

function readGamepad() {
  const gamepads = navigator
    .getGamepads()
    .filter(isNotNullish)
    .filter((e) => e.connected);

  gamepads.forEach((gamepad, padIndex) => {
    gamepad.buttons.forEach((button, index) => {
      const btn = buttonMap[index]?.[padIndex];
      if (!btn) return;
      if (pressedButton.has(index)) {
        if (!button.pressed) {
          pressedButton.delete(index);
          window.dispatchEvent(new CustomEvent(events.RELEASE_BUTTON, { detail: btn }));
        }
      } else {
        if (button.pressed) {
          pressedButton.add(index);
          window.dispatchEvent(new CustomEvent(events.PRESS_BUTTON, { detail: btn }));
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
