import { audios, Color, COLOR_BLACK, FontType } from './assets';
import { World } from './world';

export class Component {
  toJSON() {
    return {
      ...this,
      _ct: this.constructor.name,
    };
  }
  constructor(..._args: any[]) {
    //
  }
}

export const _registeredComponents = {} as Record<string, typeof Component>;

export function registerComponent() {
  return function (cls: typeof Component) {
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
  sprite = '';

  constructor(color = COLOR_BLACK, sprite = '') {
    super();
    this.sprite = sprite;
    this.color = color;
  }
}

export type Option = { text: string; handle: string | number };

@registerComponent()
export class SelectComponent extends Component {
  options: Option[] = [];
  selected = 0;
  fontType: FontType;

  constructor(
    options: Option[] = [],
    { selected = 0, fontType = 'default' }: { selected?: number; fontType?: FontType } = {},
  ) {
    super();
    this.options = options;
    this.selected = selected;
    this.fontType = fontType;
  }

  change(step: number) {
    this.selected = (this.options.length + this.selected + step) % this.options.length;
    if (!this.options[this.selected].text) this.change(step);
  }

  getHandle() {
    return this.options[this.selected].handle;
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
