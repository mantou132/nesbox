import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css } from '@mantou/gem';
import { clamp } from 'duoyun-ui/lib/number';
import { theme } from 'duoyun-ui/lib/theme';
import { normalizeFilename } from 'src/utils';

import 'duoyun-ui/elements/file-pick';
import 'duoyun-ui/elements/form';
import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/drop-area';

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
  .input {
    background: ${theme.lightBackgroundColor};
    border-radius: ${theme.normalRound};
    padding: 0.5em;
    min-height: 10em;
  }
  .output {
    overflow: auto;
    width: auto;
    min-height: 50vh;
  }
  dy-form-item::part(label) {
    text-transform: capitalize;
  }
`);

type State = {
  files: File[];
  args: {
    width: number;
    height: number;
  };
  result: string;
};

/**
 * @customElement p-image
 */
@customElement('p-image')
@adoptedStyle(style)
export class PImageElement extends GemElement<State> {
  state: State = {
    files: [],
    args: {
      width: 16,
      height: 16,
    },
    result: '',
  };

  #canvas = new OffscreenCanvas(0, 0);

  #weakMap = new WeakMap<File, Map<string, Uint8ClampedArray>>();

  #onChange = async (evt: CustomEvent<File[]>) => {
    this.setState({ files: evt.detail });
    evt.stopPropagation();
  };

  #regenerateResult = async () => {
    const { files, args } = this.state;
    const arg = JSON.stringify(args);
    const ctx = this.#canvas.getContext('2d')!;

    await Promise.all(
      files.map(async (file) => {
        if (!this.#weakMap.has(file)) {
          this.#weakMap.set(file, new Map());
        }
        const map = this.#weakMap.get(file)!;
        if (!map.has(arg)) {
          this.#canvas.width = args.width;
          this.#canvas.height = args.height;
          const image = new Image();
          image.src = URL.createObjectURL(file);
          await new Promise((res) => (image.onload = res));
          ctx.drawImage(image, 0, 0, args.width, args.height);
          const pixels = ctx.getImageData(0, 0, args.width, args.height).data;
          map.set(arg, pixels);
          URL.revokeObjectURL(image.src);
        }
      }),
    );

    this.setState({
      result: files.reduce((p, c) => {
        const pixels = this.#weakMap.get(c)?.get(arg);
        return p + `export const ${normalizeFilename(c.name)} = new Uint8ClampedArray([${pixels}]);` + `\n`;
      }, ''),
    });
  };

  #onArgChange = (evt: CustomEvent<{ name: string; value: string }>) => {
    const { name, value } = evt.detail;
    this.setState({ args: { ...this.state.args, [name]: clamp(0, Number(value), 100) } });
  };

  #onDropChange = (evt: CustomEvent<File[]>) => {
    this.setState({ files: [...this.state.files, ...evt.detail] });
  };

  mounted = () => {
    this.effect(
      () => this.#regenerateResult,
      () => [this.state.files, this.state.args],
    );
  };

  render = () => {
    const { files, args, result } = this.state;
    return html`
      <dy-drop-area class="input" accept="image/*" @change=${this.#onDropChange}>
        <dy-file-pick .multiple=${true} .type=${'image'} .value=${files} @change=${this.#onChange}></dy-file-pick>
      </dy-drop-area>
      <dy-form @itemchange=${this.#onArgChange} .inline=${true}>
        ${Object.entries(args).map(
          ([k, v]) => html`<dy-form-item type="number" .name=${k} .label=${k} .value=${v}></dy-form-item>`,
        )}
      </dy-form>
      <dy-input class="output" disabled type="textarea" .value=${result}></dy-input>
    `;
  };
}
