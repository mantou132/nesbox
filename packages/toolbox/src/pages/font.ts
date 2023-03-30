import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css } from '@mantou/gem';
import { theme } from 'duoyun-ui/lib/theme';
import { getCorSrc, getInputItemType, getInputItemValue, normalizeFilename, saveFile } from 'src/utils';
import QOI from 'qoijs';
import { Font, encodeFont } from '@mantou/ecs';

import type { DuoyunFormItemElement } from 'duoyun-ui/elements/form';
import type { DuoyunSelectElement } from 'duoyun-ui/elements/select';

import 'duoyun-ui/elements/select';
import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/form';
import 'duoyun-ui/elements/button';

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  .input {
    width: auto;
    height: 10em;
  }
  .output {
    overflow: auto;
    width: auto;
    min-height: 50vh;
  }
  .preview {
    display: flex;
    image-rendering: pixelated;
    height: 3em;
  }
  .preview * {
    height: 100%;
    background-color: ${theme.disabledColor};
  }
  dy-form-item {
    text-transform: capitalize;
  }
`);

type State = {
  localFonts: string[];
  webFonts: string[];
  input: string;
  result: string;
  previews: HTMLCanvasElement[];
  args: {
    currentFont: string;
    fontSize: number;
    qoi: boolean;
  };
};

/**
 * @customElement p-font
 */
@customElement('p-font')
@adoptedStyle(style)
export class PFontElement extends GemElement<State> {
  state: State = {
    localFonts: [],
    webFonts: [],
    input: `abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!"#&'()+,-./0123456789:;<=>?@[]_{}~‐ `,
    result: '',
    previews: [],
    args: {
      currentFont: 'Sans-Serif',
      fontSize: 10,
      qoi: true,
    },
  };

  #loadLocalFonts = async () => {
    if ('queryLocalFonts' in window && !this.state.localFonts.length) {
      const fonts: Set<string> = new Set();
      // Chromium is implemented as a Promise
      const iterable = await window.queryLocalFonts();
      for (const font of iterable) {
        fonts.add(font.family);
      }
      this.setState({ localFonts: [...fonts] });
    }
  };

  #onInputChange = (evt: CustomEvent<string>) => {
    this.setState({ input: evt.detail });
  };

  #onPaste = async (evt: ClipboardEvent) => {
    const target = evt.target as DuoyunFormItemElement;
    const url = getCorSrc(evt.clipboardData?.getData('text'));
    const name = url
      .split('/')
      .reverse()
      .find((e) => !!e)!
      .split('.')
      .shift()!
      .replace(/-|_/g, ' ')
      .trim();
    const font = await new FontFace(name, `url(${url})`).load();
    document.fonts.add(font);
    this.setState({ webFonts: [...new Set([...this.state.webFonts, name])] });
    target.shadowRoot?.querySelector<DuoyunSelectElement>('dy-select')?.setState?.({ search: name });
  };

  #onArgChange = (evt: CustomEvent<{ name: keyof State['args']; value: string }>) => {
    const { args } = this.state;
    const { name, value } = evt.detail;
    this.setState({ args: { ...args, [name]: getInputItemValue(args[name], value) } });
  };

  #canvas = new OffscreenCanvas(0, 0);
  #resultData = new Map<string, Map<string, { width: number; data: Uint8ClampedArray }>>();
  #regenerateResult = async () => {
    const { input, args } = this.state;
    const arg = JSON.stringify(args);
    const ctx = this.#canvas.getContext('2d', { willReadFrequently: true })!;

    const chars = [...new Set([...input])];
    const charData = chars.map((char) => {
      if (!this.#resultData.has(arg)) {
        this.#resultData.set(arg, new Map());
      }
      const map = this.#resultData.get(arg)!;
      if (!map.has(char)) {
        this.#canvas.width = args.fontSize;
        this.#canvas.height = args.fontSize;
        ctx.font = `${args.fontSize}px ${args.currentFont}`;
        const { width, fontBoundingBoxDescent, fontBoundingBoxAscent } = ctx.measureText(char);
        const intWidth = Math.trunc(width);
        ctx.fillText(char, 0, args.fontSize - (args.fontSize - (fontBoundingBoxAscent - fontBoundingBoxDescent)) / 2);
        const data = intWidth ? ctx.getImageData(0, 0, intWidth, args.fontSize).data : new Uint8ClampedArray();
        map.set(char, { width: intWidth, data: data });
      }
      return map.get(char)!;
    });
    this.setState({
      previews: charData.slice(0, 15).map(({ width, data }) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = args.fontSize;
        width && canvas.getContext('2d')!.putImageData(new ImageData(data, width), 0, 0);
        return canvas;
      }),
      result:
        `import ${normalizeFilename(args.currentFont)}Buf from 'assets/${normalizeFilename(
          args.currentFont,
        )}.data';\n\n` +
        (args.qoi
          ? `parseFontBuf(QOI.decode(${normalizeFilename(args.currentFont)}Buf).data)`
          : `parseFontBuf(${normalizeFilename(args.currentFont)}Buf)`),
    });
  };

  #onDownload = async () => {
    const { args, input } = this.state;
    const arg = JSON.stringify(args);
    const map = this.#resultData.get(arg)!;
    const chars = new Set([...input]);

    const font: Font = { fontSize: args.fontSize, fontSet: {} };
    chars.forEach((char) => {
      font.fontSet[char] = map.get(char)!;
    });

    const buf = encodeFont(font);
    saveFile(
      new File(
        [
          new Blob([
            args.qoi
              ? new Uint8ClampedArray(
                  QOI.encode(buf, {
                    width: buf.length / 4,
                    height: 1,
                    channels: 4,
                    colorspace: 0,
                  }),
                )
              : buf,
          ]),
        ],
        `${normalizeFilename(args.currentFont)}.data`,
      ),
    );
  };

  mounted = () => {
    this.#regenerateResult();
    this.effect(
      () => this.#regenerateResult,
      () => [this.state.input, this.state.args],
    );
  };

  render = () => {
    const { localFonts, input, args, result, previews, webFonts } = this.state;
    return html`
      <dy-input class="input" type="textarea" .value=${input} @change=${this.#onInputChange}></dy-input>
      <dy-form @itemchange=${this.#onArgChange} .inline=${true}>
        <dy-form-item
          type="select"
          searchable
          label="Font Family"
          name="currentFont"
          @click=${this.#loadLocalFonts}
          @paste=${this.#onPaste}
          .value=${args.currentFont}
          .dataList=${[...new Set(['Sans-Serif', 'Serif', ...webFonts, ...localFonts])].map((e) => ({
            value: e,
            label: html`<div style="font-family: ${e}">${e}</div>`,
          }))}
        >
        </dy-form-item>
        ${Object.entries(args).map(([k, v]) =>
          k === 'currentFont'
            ? ''
            : html`
                <dy-form-item
                  .type=${getInputItemType(v)}
                  .checked=${Boolean(v)}
                  .name=${k}
                  .label=${k}
                  .value=${v}
                ></dy-form-item>
              `,
        )}
        <dy-button @click=${this.#onDownload}>Download</dy-button>
      </dy-form>
      <div class="preview" style="font-size: ${args.fontSize}px">${previews}</div>
      <dy-input class="output" disabled type="textarea" .value=${result}></dy-input>
    `;
  };
}
