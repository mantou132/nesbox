import { Button, Player } from '@mantou/nes';

const OFFSET = 8;

const INPUT_A = 0x01;
const INPUT_B = 0x02;
const INPUT_SELECT = 0x04;
const INPUT_START = 0x08;
const INPUT_UP = 0x10;
const INPUT_DOWN = 0x20;
const INPUT_LEFT = 0x40;
const INPUT_RIGHT = 0x80;

const INPUT_T_A = 0x01;
const INPUT_T_B = 0x02;
const INPUT_T_C = 0x04;

function getTurboButtonBitFlag(button: Button) {
  switch (button) {
    case Button.JoypadTurboB:
      return INPUT_T_A;
    case Button.JoypadTurboA:
      return INPUT_T_B;
    case Button.JoypadTurboC:
      return INPUT_T_C;
    default:
      return 0;
  }
}

function getButtonBitFlag(button: Button) {
  switch (button) {
    case Button.JoypadB:
      return INPUT_B;
    case Button.JoypadA:
      return INPUT_A;
    case Button.JoypadC:
      return INPUT_A | INPUT_B;
    case Button.JoypadTurboB:
      return INPUT_B;
    case Button.JoypadTurboA:
      return INPUT_A;
    case Button.JoypadTurboC:
      return INPUT_A | INPUT_B;
    case Button.JoypadLeft:
      return INPUT_LEFT;
    case Button.JoypadRight:
      return INPUT_RIGHT;
    case Button.JoypadUp:
      return INPUT_UP;
    case Button.JoypadDown:
      return INPUT_DOWN;
    case Button.Start:
      return INPUT_START;
    case Button.Select:
      return INPUT_SELECT;
    default:
      return 0;
  }
}

function getPlayerOffset(player: Player) {
  switch (player) {
    case Player.One:
      return 0 * OFFSET;
    case Player.Two:
      return 1 * OFFSET;
    case Player.Three:
      return 2 * OFFSET;
    case Player.Four:
      return 3 * OFFSET;
  }
}

const playersOffset = [
  getPlayerOffset(Player.One),
  getPlayerOffset(Player.Two),
  getPlayerOffset(Player.Three),
  getPlayerOffset(Player.Four),
];

export class Controllers {
  #state = 0;
  #turboState = 0;

  handleEvent(player: Player, button: Button, pressed: boolean) {
    const offset = getPlayerOffset(player);
    const turboBtn = getTurboButtonBitFlag(button) << offset;
    if (turboBtn) {
      this.#turboState = pressed ? this.#turboState | turboBtn : this.#turboState & ~turboBtn;
    } else {
      const btn = getButtonBitFlag(button) << offset;
      this.#state = pressed ? this.#state | btn : this.#state & ~btn;
    }
  }

  getState(frameNum = 0) {
    // 20 hz
    if (frameNum && frameNum % 5) {
      for (const offset of playersOffset) {
        const turboState = this.#turboState >> offset;
        const state = this.#state >> offset;
        if (!turboState) break;
        if (turboState & INPUT_T_A) {
          const pressed = state & INPUT_A;
          this.#state = pressed ? this.#state & ~INPUT_A : this.#state | INPUT_A;
        }
        if (turboState & INPUT_T_B) {
          const pressed = state & INPUT_B;
          this.#state = pressed ? this.#state & ~INPUT_B : this.#state | INPUT_B;
        }
        if (turboState & INPUT_T_C) {
          const pressed = state & INPUT_A && state & INPUT_B;
          const btn = INPUT_A | INPUT_B;
          this.#state = pressed ? this.#state & ~btn : this.#state | btn;
        }
      }
    }

    return this.#state;
  }
}
