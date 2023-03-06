export type Char = { width: number; data: Uint8ClampedArray };

export type FontSet = Record<string, Char>;

export type Font = {
  fontSize: number;
  fontSet: FontSet;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type FontType = 'default' | 'heading' | (string & {}) | number;

type Fonts = { [T in FontType]: Font };

const defaultCharBuffer = new Uint8ClampedArray(40 * 40 * 4).fill(255);

function getProxyFont(font: Font): Font {
  return {
    fontSize: font.fontSize,
    fontSet: new Proxy(font.fontSet, {
      get(target, char): Char {
        return (
          target[char as string] || {
            width: font.fontSize,
            data: new Uint8ClampedArray(defaultCharBuffer.buffer, 0, 4 * font.fontSize ** 2),
          }
        );
      },
    }),
  };
}

export const fonts = new Proxy({ default: getProxyFont({ fontSize: 10, fontSet: {} }) } as Fonts, {
  get(fonts, type) {
    const f = fonts[type as FontType];
    return f || fonts.default;
  },
});

export function loadFont(type: FontType, font: Font) {
  fonts[type] = getProxyFont(font);
}

const defaultAudio = new Float32Array(44100 / 60);

export const audios = new Proxy({} as Record<string, Float32Array>, {
  get(target, type) {
    return target[type as string] || defaultAudio;
  },
});

export function loadAudio(name: string | number, data: Float32Array) {
  audios[name] = data;
}

export type Sprite = { width: number; data: Uint8ClampedArray };

const defaultSprite = { width: 0, data: new Uint8ClampedArray() };
export const sprites = new Proxy({} as Record<string, Sprite>, {
  get(target, type) {
    return target[type as string] || defaultSprite;
  },
});

export function loadSprite(name: string, sprite: Sprite) {
  sprites[name] = sprite;
}

export class Color extends Uint8ClampedArray {
  constructor(r: ArrayBuffer | number | number[], g = 0, b = 0, a = 255) {
    if (r instanceof ArrayBuffer) {
      super(r, g, b || undefined);
    } else if (Array.isArray(r)) {
      super(r);
    } else {
      super([r, g, b, a]);
    }
  }

  toJSON() {
    return [this[0], this[1], this[2], this[3]];
  }
}

export const COLOR_WHITE = new Color(255, 255, 255, 255);
export const COLOR_BLACK = new Color(0, 0, 0, 255);
export const COLOR_GRAY = new Color(128, 128, 128, 255);
export const COLOR_RED = new Color(255, 0, 0, 255);
export const COLOR_GREEN = new Color(0, 255, 0, 255);
export const COLOR_BLUE = new Color(0, 0, 255, 255);
