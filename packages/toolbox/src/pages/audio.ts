import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css } from '@mantou/gem';
import { theme } from 'duoyun-ui/lib/theme';
import { normalizeFilename } from 'src/utils';

import 'duoyun-ui/elements/drop-area';
import 'duoyun-ui/elements/file-pick';
import 'duoyun-ui/elements/form';
import 'duoyun-ui/elements/input';

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
    sampleRate: number;
  };
  result: string;
};

/**
 * @customElement p-audio
 */
@customElement('p-audio')
@adoptedStyle(style)
export class PAudioElement extends GemElement<State> {
  state: State = {
    files: [],
    args: {
      sampleRate: 44100,
    },
    result: '',
  };

  #onChange = async (evt: CustomEvent<File[]>) => {
    this.setState({ files: evt.detail });
    evt.stopPropagation();
  };

  #weakMap = new WeakMap<File, Map<string, Float32Array>>();
  #regenerateResult = async () => {
    const { files, args } = this.state;
    const arg = JSON.stringify(args);
    const ctx = new AudioContext({ sampleRate: args.sampleRate });

    await Promise.all(
      files.map(async (file) => {
        if (!this.#weakMap.has(file)) {
          this.#weakMap.set(file, new Map());
        }
        const map = this.#weakMap.get(file)!;
        if (!map.has(arg)) {
          const buffer = await file.arrayBuffer();
          const data = (await ctx.decodeAudioData(buffer)).getChannelData(0);
          map.set(arg, data);
        }
        map.get(arg);
      }),
    );

    this.setState({
      result: files.reduce((p, c) => {
        const array = this.#weakMap.get(c)?.get(arg);
        return p + `export const ${normalizeFilename(c.name)} = new Float32Array([${array}]);` + `\n`;
      }, ''),
    });
  };

  #onArgChange = (evt: CustomEvent<{ name: string; value: string }>) => {
    const { name, value } = evt.detail;
    this.setState({ args: { ...this.state.args, [name]: Number(value) } });
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
      <dy-drop-area class="input" accept="audio/*" @change=${this.#onDropChange}>
        <dy-file-pick .multiple=${true} .type=${'file'} .value=${files} @change=${this.#onChange}></dy-file-pick>
      </dy-drop-area>
      <dy-form @itemchange=${this.#onArgChange} .inline=${true}>
        ${Object.entries(args).map(
          ([k, v]) =>
            html`<dy-form-item
              type="number"
              .name=${k}
              .label=${k.replace(/([A-Z])/g, ' $1')}
              .value=${v}
            ></dy-form-item>`,
        )}
      </dy-form>
      <dy-input class="output" disabled type="textarea" .value=${result}></dy-input>
    `;
  };
}
