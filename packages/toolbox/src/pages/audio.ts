import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css } from '@mantou/gem';
import { theme } from 'duoyun-ui/lib/theme';
import { utf8ToB64 } from 'duoyun-ui/lib/encode';
import { throttle } from 'duoyun-ui/lib/utils';
import { getInputItemType, getInputItemValue, normalizeFilename, sampleToChart } from 'src/utils';
import QOI from 'qoijs';

import 'duoyun-ui/elements/drop-area';
import 'duoyun-ui/elements/file-pick';
import 'duoyun-ui/elements/form';
import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/help-text';
import 'duoyun-ui/elements/action-text';
import 'duoyun-ui/elements/chart-zoom';

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
  dy-form-item {
    text-transform: capitalize;
  }
  dy-chart-zoom {
    border-radius: 0;
    width: 100%;
    order: 2;
  }
  dy-action-text {
    order: 1;
  }
`);

type State = {
  files: File[];
  charts: number[][][];
  args: {
    sampleRate: number;
    qoi: boolean;
    ranges: Record<string, number[]>;
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
    charts: [],
    args: {
      sampleRate: 44100,
      qoi: true,
      ranges: {},
    },
    result: '',
  };

  #onChange = async (evt: CustomEvent<File[]>) => {
    this.setState({ files: evt.detail });
    evt.stopPropagation();
  };

  #weakMap = new WeakMap<
    File,
    Map<string, { data: Uint8Array | Float32Array; origin: Float32Array; chart: number[][] }>
  >();
  #audioContext: AudioContext;
  #regenerateResult = throttle(async () => {
    const { files, args } = this.state;
    const arg = JSON.stringify(args);
    this.#audioContext = new AudioContext({ sampleRate: args.sampleRate });

    const charts = await Promise.all(
      files.map(async (file) => {
        if (!this.#weakMap.has(file)) {
          this.#weakMap.set(file, new Map());
        }
        const map = this.#weakMap.get(file)!;
        if (!map.has(arg)) {
          const fileBuffer = await file.arrayBuffer();
          const audioArray = (await this.#audioContext.decodeAudioData(fileBuffer)).getChannelData(0);
          const range = (args.ranges[file.name] || [0, 1]).map((e) => Math.round(e * audioArray.length));
          const len = range[1] - range[0];
          const origin = new Float32Array(audioArray.buffer, range[0] * 4, len);
          map.set(arg, {
            chart: [[-2, 0], [-1, 2], ...sampleToChart(audioArray).map((v, i) => [i, v + 1])],
            data: args.qoi
              ? (() => {
                  const encodeBuffer = QOI.encode(new Uint8Array(audioArray.buffer, range[0] * 4, len * 4), {
                    width: len,
                    height: 1,
                    channels: 4,
                    colorspace: 0,
                  });
                  const array = new Uint8Array(Math.ceil(encodeBuffer.byteLength / 4) * 4);
                  array.set(new Uint8Array(encodeBuffer));
                  return array;
                })()
              : origin,
            origin,
          });
        }
        return map.get(arg)!.chart;
      }),
    );

    this.setState({
      charts,
      result: files.reduce((p, c) => {
        const array = this.#weakMap.get(c)?.get(arg);
        const value = args.qoi
          ? `new Float32Array(QOI.decode(new Uint8Array([${array?.data}])).data.buffer)`
          : `new Float32Array([${array?.data}])`;
        return p + `export const ${normalizeFilename(c.name)} = ${value};` + `\n`;
      }, ''),
    });
  });

  #onArgChange = (evt: CustomEvent<{ name: keyof State['args']; value: string }>) => {
    const { args } = this.state;
    const { name, value } = evt.detail;
    this.setState({ args: { ...args, [name]: getInputItemValue(args[name], value) } });
  };

  #onDropChange = (evt: CustomEvent<File[]>) => {
    this.setState({ files: [...this.state.files, ...evt.detail] });
  };

  #onRangeChange = (name: string, evt: CustomEvent<number[]>) => {
    this.setState({
      args: {
        ...this.state.args,
        ranges: {
          ...this.state.args.ranges,
          [name]: evt.detail,
        },
      },
    });
  };

  #onPlay = (file: File) => {
    const arg = JSON.stringify(this.state.args);
    const { origin } = this.#weakMap.get(file)!.get(arg)!;
    const node = this.#audioContext.createBufferSource();
    const buffer = this.#audioContext.createBuffer(1, origin.length, this.#audioContext.sampleRate);
    buffer.getChannelData(0).set(origin);
    node.buffer = buffer;
    node.connect(this.#audioContext.destination);
    node.start();
  };

  mounted = () => {
    this.effect(
      () => this.#regenerateResult,
      () => [this.state.files, this.state.args],
    );
  };

  render = () => {
    const { files, args, result, charts } = this.state;

    return html`
      <dy-drop-area class="input" accept="audio/*" @change=${this.#onDropChange}>
        <dy-file-pick .multiple=${true} .type=${'file'} .value=${files} @change=${this.#onChange}>
          ${charts.map(
            (
              e,
              i,
              _,
              slot = files[i] && utf8ToB64(files[i].name, true),
              range = (files[i] && args.ranges[files[i].name]) || [0, 1],
            ) =>
              slot &&
              html`
                <dy-chart-zoom
                  .values=${e}
                  slot=${slot}
                  .value=${range}
                  @change=${this.#onRangeChange.bind(this, files[i].name)}
                  @dblclick=${this.#onRangeChange.bind(
                    this,
                    files[i].name,
                    new CustomEvent('change', { detail: [0, 1] }),
                  )}
                ></dy-chart-zoom>
                <dy-action-text class="play" slot=${slot} @click=${() => this.#onPlay(files[i])}>
                  Play(${range.map((e) => e.toFixed(2)).join()})
                </dy-action-text>
              `,
          )}
        </dy-file-pick>
      </dy-drop-area>
      <dy-form @itemchange=${this.#onArgChange} .inline=${true}>
        ${Object.entries(args).map(([k, v]) =>
          k == 'ranges'
            ? ''
            : html`
                <dy-form-item
                  .type=${getInputItemType(v)}
                  .checked=${Boolean(v)}
                  .name=${k}
                  .label=${k.replace(/([A-Z])/g, ' $1')}
                  .value=${v}
                ></dy-form-item>
              `,
        )}
      </dy-form>
      <dy-input class="output" disabled type="textarea" .value=${result}></dy-input>
      <dy-help-text>Length: ${result.length}</dy-help-text>
    `;
  };
}
