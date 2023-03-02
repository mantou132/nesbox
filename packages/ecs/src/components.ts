import { audios, Color, COLOR_BLACK, FontType } from './assets';
import { World } from './world';

export class Component {
  toJSON() {
    return {
      ...this,
      _componentType: this.constructor.name,
    };
  }
  constructor(..._args: any[]) {
    //
  }
}

export const registeredComponents = {} as Record<string, typeof Component>;

function registerComponent() {
  return function (cls: typeof Component) {
    registeredComponents[cls.name] = cls;
  };
}

@registerComponent()
export class PositionComponent extends Component {
  x = 0;
  y = 0;
  constructor(x = 0, y = 0) {
    super();
    this.x = x;
    this.y = y;
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
export class SpeedComponent extends Component {
  value = 0;
  x = 0;
  y = 0;

  constructor(value = 0, x = 0, y = 0) {
    super();
    this.value = value;
    this.x = x;
    this.y = y;
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

  constructor(options: Option[] = [], selected = 0) {
    super();
    this.options = options;
    this.selected = selected;
  }

  change(step: number) {
    this.selected = (this.options.length + this.selected + step) % this.options.length;
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

  constructor(text = '', width = 0, fontType: FontType = 'default') {
    super();
    this.text = text;
    this.width = width;
    this.fontType = fontType;
  }
}

// only work on world
@registerComponent()
export class AudioComponent extends Component {
  type: string;
  offsetBytes = 0;
  loop = false;

  constructor(type = '', loop = false, offsetBytes = 0) {
    super();
    this.type = type;
    this.loop = loop;
    this.offsetBytes = offsetBytes;
  }

  getFrame(world: World) {
    const len = world.sampleRate / world.fps;
    const frame = new Float32Array(audios[this.type].buffer, this.offsetBytes, len);
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
