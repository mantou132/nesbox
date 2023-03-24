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

// | fontSize | char = 4 bytes| width | data | ...
export function encodeFont(font: Font) {
  const entries = Object.entries(font.fontSet);
  const len = entries.reduce((p, [_, { data }]) => p + data.length, 0);
  const buf = new Uint8Array(Math.ceil((1 + len + 5 * entries.length) / 4) * 4);
  buf[0] = font.fontSize;
  let offset = 1;
  entries.forEach(([char, { data, width }]) => {
    const charBuf = new Uint32Array(1);
    charBuf[0] = char.codePointAt(0) || 0;
    buf.set(new Uint8Array(charBuf.buffer), offset);
    offset += 4;
    buf[offset] = width;
    offset += 1;
    buf.set(data, offset);
    offset += data.length;
  });
  return buf;
}

export function decodeFontBuf(buf: Uint8Array) {
  const fontSize = buf[0];
  const font: Font = { fontSize, fontSet: {} };
  let offset = 1;
  while (true) {
    if (buf.length - offset < 4) {
      return font;
    }
    const charBuf = new Uint32Array(new Uint8Array([...new Uint8Array(buf.buffer, offset, 4)]).buffer);
    const char = String.fromCodePoint(charBuf[0]);
    offset += 4;
    const width = buf[offset];
    offset += 1;
    const len = fontSize * width * 4;
    font.fontSet[char] = { width, data: new Uint8ClampedArray(buf.buffer, offset, len) };
    offset += len;
  }
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

const defaultSprite = { width: 1, data: new Uint8ClampedArray([0, 0, 0, 0]) };
export const sprites = new Proxy({} as Record<string, Sprite>, {
  get(target, type) {
    return target[type as string] || defaultSprite;
  },
});

export function loadSprite(name: string | number, sprite: Sprite) {
  sprites[name] = sprite;
}

export class Color extends Uint8ClampedArray {
  constructor(r: ArrayBuffer | number | number[], g = 0, b = 0, a = 255) {
    if (typeof r === 'number') {
      super([r, g, b, a]);
    } else if ('length' in r) {
      super(r);
    } else {
      super(r, g, b || undefined);
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
