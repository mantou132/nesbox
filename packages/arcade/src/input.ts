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

function getButtonBitFlag(button: Button) {
  switch (button) {
    case Button.JoypadB:
      return INP_B1;
    case Button.JoypadA:
      return INP_B2;
    case Button.JoypadC:
      return INP_B3;
    case Button.JoypadTurboB:
      return INP_B4;
    case Button.JoypadTurboA:
      return INP_B5;
    case Button.JoypadTurboC:
      return INP_B6;
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
  #index = 0;
  #state = 0;
  #alx = 0;
  #aly = 0;
  #arx = 0;
  #ary = 0;

  constructor(index: number) {
    this.#index = index;
  }

  handleEvent(button: Button, pressed: boolean) {
    const btn = getButtonBitFlag(button);
    this.#state = pressed ? this.#state | btn : this.#state & ~btn;
  }

  getArgs() {
    // https://github.com/mantou132/FBNeo/blob/nesbox/src/intf/input/sdl/inp_sdl2.cpp#L49
    return [this.#index, this.#state, this.#alx, this.#aly, this.#arx, this.#ary] as const;
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
