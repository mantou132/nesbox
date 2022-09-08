import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  property,
  classMap,
  styleMap,
  repeat,
  numattribute,
  emitter,
  Emitter,
} from '@mantou/gem';

import { events } from 'src/constants';
import { GamepadBtnIndex } from 'src/gamepad';
import { theme } from 'src/theme';
import { updateMtApp } from 'src/mt-app';

export type Item = {
  id: number | string;
  img: string;
  handle: () => void;
};

const style = createCSSSheet(css`
  :host {
    position: relative;
    width: min(15em, 40vh);
  }
  .other,
  .current {
    position: absolute;
    aspect-ratio: 1;
    bottom: 0;
    transition: all 0.3s ${theme.timingFunction};
  }
  .other {
    width: 60%;
    padding-inline: 0.25em;
  }
  .current {
    width: 100%;
    z-index: 1;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`);

/**
 * @customElement nesbox-rotor
 */
@customElement('nesbox-rotor')
@adoptedStyle(style)
export class NesboxRotorElement extends GemElement {
  @numattribute index: number;
  @emitter change: Emitter<number>;

  @property data?: Item[];

  #canvas: HTMLCanvasElement;

  constructor() {
    super();
    this.#canvas = document.createElement('canvas');
    this.#canvas.width = 10;
    this.#canvas.height = 6;
  }

  #addIndex = (add: number) => {
    if (!this.data) return 0;
    return (this.data.length + this.index + add) % this.data.length;
  };

  #pressButton = ({ detail }: CustomEvent<GamepadBtnIndex>) => {
    switch (detail) {
      case GamepadBtnIndex.Left:
        this.change(this.#addIndex(-1));
        break;
      case GamepadBtnIndex.Right:
        this.change(this.#addIndex(1));
        break;
      case GamepadBtnIndex.A:
        this.data?.[this.index]?.handle();
        break;
    }
  };

  mounted = () => {
    this.effect(() => {
      const img = this.shadowRoot?.querySelector<HTMLImageElement>('.current img');
      if (img) {
        new Promise((res, rej) => {
          if (img.complete) {
            res(null);
          } else {
            img.onload = res;
            img.onerror = rej;
          }
        })
          .then(() => {
            const ctx = this.#canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0, this.#canvas.width, this.#canvas.height);
            updateMtApp({ imgUrl: this.#canvas.toDataURL() });
          })
          .catch(() => 0);
      }
    });

    addEventListener(events.PRESS_BUTTON_INDEX, this.#pressButton);
    return () => {
      removeEventListener(events.PRESS_BUTTON_INDEX, this.#pressButton);
    };
  };

  render = () => {
    if (!this.data?.length) return html``;

    const beforeList = [this.data[this.#addIndex(-1)]!];
    const afterList = Array.from(Array(10), (_, i) => this.data![this.#addIndex(i + 1)]);
    const list = [...beforeList, this.data[this.index], ...afterList];
    return html`${repeat(
      list,
      (item) => item.id,
      (item, index) =>
        html`
          <div
            @click=${() =>
              index === beforeList.length
                ? this.data![this.index].handle()
                : this.change(this.#addIndex(index - beforeList.length))}
            class=${classMap({ other: beforeList.length !== index, current: beforeList.length === index })}
            style=${styleMap(
              index === beforeList.length
                ? { left: 0, right: 0, transform: 'translate(0)' }
                : {
                    [index < beforeList.length ? 'right' : 'left']: 'calc(100% + 0.75em)',
                    transform: `translate(${
                      (index - beforeList.length - Math.sign(index - beforeList.length)) * 100
                    }%)`,
                  },
            )}
          >
            <img src=${item.img} alt="Cover" crossorigin="anonymous" />
          </div>
        `,
    )}`;
  };
}
