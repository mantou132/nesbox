import { Button, Player } from '@mantou/nes';

export const INP_LEFT = 1;
export const INP_RIGHT = 1 << 1;
export const INP_UP = 1 << 2;
export const INP_DOWN = 1 << 3;
export const INP_START = 1 << 4;
export const INP_SELECT = 1 << 5;
export const INP_B1 = 1 << 6;
export const INP_B2 = 1 << 7;
export const INP_B3 = 1 << 8;
export const INP_B4 = 1 << 9;
export const INP_B5 = 1 << 10;
export const INP_B6 = 1 << 11;

export const K_INP_LEFT = 0x8000 | INP_LEFT;
export const K_INP_RIGHT = 0x8000 | INP_RIGHT;
export const K_INP_UP = 0x8000 | INP_UP;
export const K_INP_DOWN = 0x8000 | INP_DOWN;
export const K_INP_SELECT = 0x8000 | INP_SELECT;
export const K_INP_START = 0x8000 | INP_START;
export const K_INP_B1 = 0x8000 | INP_B1;
export const K_INP_B2 = 0x8000 | INP_B2;
export const K_INP_B3 = 0x8000 | INP_B3;
export const K_INP_B4 = 0x8000 | INP_B4;
export const K_INP_B5 = 0x8000 | INP_B5;
export const K_INP_B6 = 0x8000 | INP_B6;

function getButtonBitFlag(button: Button) {
  switch (button) {
    case Button.JoypadA:
      return INP_B1;
    case Button.JoypadB:
      return INP_B2;
    case Button.JoypadTurboA:
      return INP_B4;
    case Button.JoypadTurboB:
      return INP_B5;
    case Button.JoypadLeft:
      return INP_LEFT;
    case Button.JoypadRight:
      return INP_RIGHT;
    case Button.JoypadUp:
      return INP_UP;
    case Button.JoypadDown:
      return INP_DOWN;
    case Button.Start:
      return INP_START;
    case Button.Select:
      return INP_SELECT;
    default:
      return 0;
  }
}

function getPlayerIdx(player: Player) {
  switch (player) {
    case Player.One:
      return 0;
    case Player.Two:
      return 1;
    case Player.Three:
      return 2;
    case Player.Four:
      return 3;
  }
}

export class Controller {
  index = 0;
  state = 0;
  alx = 0;
  aly = 0;
  arx = 0;
  ary = 0;

  constructor(index: number) {
    this.index = index;
  }

  handleEvent(button: Button, pressed: boolean) {
    const btn = getButtonBitFlag(button);
    this.state = pressed ? this.state | btn : this.state & ~btn;
  }
}

export class Controllers {
  #controllers: Controller[] = [];
  constructor(count = 4) {
    for (let i = 0; i < count; i++) {
      this.#controllers[i] = new Controller(i);
    }
  }

  getController(player: Player) {
    const index = getPlayerIdx(player);
    return this.#controllers[index];
  }
}
