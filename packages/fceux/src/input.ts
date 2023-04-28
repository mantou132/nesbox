import { Button, Player } from '@mantou/nes';

const INPUT_A = 0x01;
const INPUT_B = 0x02;
const INPUT_SELECT = 0x04;
const INPUT_START = 0x08;
const INPUT_UP = 0x10;
const INPUT_DOWN = 0x20;
const INPUT_LEFT = 0x40;
const INPUT_RIGHT = 0x80;

function getButtonBitFlag(button: Button) {
  switch (button) {
    case Button.JoypadB:
      return INPUT_B;
    case Button.JoypadA:
      return INPUT_A;
    case Button.JoypadC:
      return INPUT_A & INPUT_B;
    case Button.JoypadTurboB:
      return INPUT_B;
    case Button.JoypadTurboA:
      return INPUT_A;
    case Button.JoypadTurboC:
      return INPUT_A & INPUT_B;
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
      return 0 * 8;
    case Player.Two:
      return 1 * 8;
    case Player.Three:
      return 2 * 8;
    case Player.Four:
      return 3 * 8;
  }
}

export class Controllers {
  #state = 0;

  handleEvent(player: Player, button: Button, pressed: boolean) {
    const offset = getPlayerOffset(player);
    const btn = getButtonBitFlag(button) << offset;
    this.#state = pressed ? this.#state | btn : this.#state & ~btn;
  }

  getState() {
    return this.#state;
  }
}
