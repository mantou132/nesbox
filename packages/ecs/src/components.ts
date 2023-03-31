import { audios, Color, COLOR_BLACK, FontType } from './assets';
import { hitRect } from './utils';
import { World } from './world';

export abstract class Component {
  toJSON() {
    return {
      ...this,
      _ct: this.constructor.name,
    };
  }
}

export const _registeredComponents = {} as Record<string, new <T extends Component>(...arg: any[]) => T>;

export function registerComponent() {
  // arg must is optional
  return function (cls: new () => any) {
    _registeredComponents[cls.name] = cls;
  };
}

@registerComponent()
export class PositionComponent extends Component {
  x = 0;
  y = 0;
  sx = 0;
  sy = 0;

  constructor(x = 0, y = 0, sx = 0, sy = 0) {
    super();
    this.x = x;
    this.y = y;
    this.sx = sx;
    this.sy = sy;
  }

  update() {
    this.x += this.sx;
    this.y += this.sy;
  }

  restore() {
    this.x -= this.sx;
    this.y -= this.sy;
  }
}

@registerComponent()
export class SizeComponent extends Component {
  w = 0;
  h = 0;

  constructor(w = 0, h = 0) {
    super();
    this.w = w;
    this.h = h;
  }
}

@registerComponent()
export class MaterialComponent extends Component {
  color: Color;
  sprite: string | number;
  repeatX = false;
  repeatY = false;

  constructor(color = COLOR_BLACK, sprite: string | number = '', repeatX = false, repeatY = false) {
    super();
    this.sprite = sprite;
    this.color = color;
    this.repeatX = repeatX;
    this.repeatY = repeatY;
  }
}

type AnimateSequence = { sprite: string | number; color?: Color; frame?: number };

@registerComponent()
export class AnimateComponent extends Component {
  #total = 0;

  _sequences: AnimateSequence[] = [];
  _index = 0;
  _frame = 0;
  _accumulate = 0;

  loop = false;
  repeatX?: boolean;
  repeatY?: boolean;

  constructor(sequences: AnimateSequence[] = [], repeatX = false, repeatY = false, loop = false) {
    super();
    this._sequences = sequences;
    this.repeatX = repeatX;
    this.repeatY = repeatY;
    this.loop = loop;
  }

  getProgress() {
    if (!this.#total) this.#total = this._sequences.reduce((p, { frame = 1 }) => p + frame, 0);
    return this._accumulate / this.#total;
  }

  getSprite() {
    return this._sequences[this._index].sprite;
  }

  getColor() {
    return this._sequences[this._index].color;
  }

  update() {
    if (this.getProgress() === 1) {
      if (this.loop) {
        this._frame = 0;
        this._index = 0;
        this._accumulate = 0;
      } else {
        return;
      }
    }
    const { frame = 1 } = this._sequences[this._index];
    if (this._frame >= frame) {
      this._frame = 0;
      this._index++;
    } else {
      this._frame++;
    }
    this._accumulate++;
  }
}

@registerComponent()
export class RenderOnceComponent extends Component {}

@registerComponent()
export class SelectComponent extends Component {
  options: string[] = [];
  selected = 0;
  fontType: FontType;

  constructor(
    options: string[] = [],
    { selected = 0, fontType = 'default' }: { selected?: number; fontType?: FontType } = {},
  ) {
    super();
    this.options = options;
    this.selected = selected;
    this.fontType = fontType;
  }

  change(step: number) {
    this.selected = (this.options.length + this.selected + step) % this.options.length;
    if (!this.options[this.selected]) this.change(step);
  }

  getCurrent() {
    return this.options[this.selected];
  }

  #optionRects: number[][] = [];
  setOptionRect(index: number, xywh: [number, number, number, number]) {
    this.#optionRects[index] = xywh;
    this.#optionRects.length = this.options.length;
  }

  isEnterHover(position?: { x: number; y: number }) {
    if (position) {
      const index = this.#optionRects.findIndex(([x, y, w, h]) => hitRect(position.x, position.y, x, y, w, h));
      if (index > -1) {
        if (this.selected != index) {
          this.selected = index;
          return { enter: true, hover: true };
        } else {
          return { enter: false, hover: true };
        }
      }
    }
    return { enter: false, hover: false };
  }
}

@registerComponent()
export class TextAreaComponent extends Component {
  text = '';
  width = 0;
  fontType: FontType;
  center = false;

  constructor(
    text = '',
    {
      width = 1000,
      fontType = 'default',
      center = false,
    }: { width?: number; fontType?: FontType; center?: boolean } = {},
  ) {
    super();
    this.text = text;
    this.width = width;
    this.fontType = fontType;
    this.center = center;
  }
}

// only work on world
@registerComponent()
export class AudioComponent extends Component {
  type: string | number;
  offsetBytes = 0;
  loop = false;

  constructor(
    type: string | number = '',
    { loop = false, offsetBytes = 0 }: { loop?: boolean; offsetBytes?: number } = {},
  ) {
    super();
    this.type = type;
    this.loop = loop;
    this.offsetBytes = offsetBytes;
  }

  getFrame(world: World) {
    const len = Math.min(world.sampleRate / world.fps, audios[this.type].length);
    const frame = new Float32Array(audios[this.type].buffer, this.offsetBytes + audios[this.type].byteOffset, len);
    const nextOffset = this.offsetBytes + len * 4;
    if (nextOffset + len * 4 > audios[this.type].length * 4) {
      if (this.loop) {
        this.offsetBytes = 0;
      } else {
        world.removeAudio(this);
      }
    } else {
      this.offsetBytes = nextOffset;
    }
    return frame;
  }
}
