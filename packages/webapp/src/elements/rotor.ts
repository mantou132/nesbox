import {
  addListener,
  adoptedStyle,
  boolattribute,
  classMap,
  css,
  customElement,
  type Emitter,
  effect,
  emitter,
  GemElement,
  html,
  mounted,
  numattribute,
  partMap,
  property,
  randomStr,
  repeat,
  shadow,
  styleMap,
} from '@mantou/gem';
import { globalEvents } from 'src/constants';
import { GamepadBtnIndex } from 'src/gamepad';
import { mtAppStore } from 'src/mt-app';
import { theme } from 'src/theme';
import { playHintSound } from 'src/utils/common';

export type Item = {
  id: number | string;
  title: string;
  img: string;
  handle: () => void;
  detail?: () => void;
};

const style = css`
  :host {
    position: relative;
    width: min(15em, 40vh);
    aspect-ratio: 1;
    transition: all 0.3s ${theme.timingFunction};
    transform: translateY(100%);
    opacity: 0;
    animation: 0.3s ${theme.timingFunction} 0s forwards show;
  }
  @keyframes show {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .other,
  .current {
    position: absolute;
    aspect-ratio: 1;
    bottom: 0;
    will-change: width, transform;
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
  dy-heading {
    position: absolute;
    bottom: calc(100% + 0.5rem);
    left: 0;
    white-space: nowrap;
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

@customElement('nesbox-rotor')
@adoptedStyle(style)
@shadow()
export class NesboxRotorElement extends GemElement {
  @boolattribute inert: boolean;
  @boolattribute finite: boolean;
  @numattribute index: number;
  @emitter change: Emitter<number>;

  @property data?: Item[];

  #canvas = new OffscreenCanvas(10, 6);

  #uidList = Array.from(Array(400), () => randomStr());
  #uidIndex = 200;

  #addIndex = (add: number) => {
    if (!this.data) return 0;
    return (this.data.length + this.index + add) % this.data.length;
  };

  #pressButton = (evt: CustomEvent<GamepadBtnIndex>) => {
    if (this.inert) return;
    switch (evt.detail) {
      case GamepadBtnIndex.Left:
        playHintSound();
        this.#uidIndex--;
        this.change(this.#addIndex(-1));
        break;
      case GamepadBtnIndex.Right:
        playHintSound();
        this.#uidIndex++;
        this.change(this.#addIndex(1));
        break;
      case GamepadBtnIndex.Start:
        playHintSound();
        this.data?.[this.index]?.handle();
        break;
      case GamepadBtnIndex.A:
      case GamepadBtnIndex.B:
        evt.stopImmediatePropagation();
        playHintSound();
        this.data?.[this.index]?.detail?.();
        break;
    }
  };

  @effect()
  #resetImg = () => {
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
        .then(async () => {
          const ctx = this.#canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0, this.#canvas.width, this.#canvas.height);
          URL.revokeObjectURL(mtAppStore.imgUrl);
          mtAppStore({ imgUrl: URL.createObjectURL(await this.#canvas.convertToBlob()) });
        })
        .catch(() => 0);
    }
  };

  @mounted()
  #init = () => {
    return addListener(window, globalEvents.PRESS_HOST_BUTTON_INDEX, this.#pressButton);
  };

  render = () => {
    if (!this.data?.length) return html``;

    const beforeList = this.finite ? this.data.slice(0, this.index) : [this.data[this.#addIndex(-1)]!];
    const afterList = this.finite
      ? this.data.slice(this.index + 1)
      : Array.from(Array(10), (_, i) => this.data![this.#addIndex(i + 1)]);
    const list = [...beforeList, this.data[this.index], ...afterList];
    return html`${repeat(
      list,
      (item, index) => (this.finite ? item.id : this.#uidList[this.#uidIndex + index]),
      (item, index, offset = index - beforeList.length, newIndex = this.#addIndex(offset)) =>
        item
          ? html`
              <div
                tabindex="0"
                @click=${() => {
                  if (offset) {
                    this.#uidIndex += offset;
                    this.change(newIndex);
                  } else {
                    this.data![this.index].handle();
                  }
                }}
                @contextmenu=${() => {
                  this.#uidIndex += offset;
                  this.change(newIndex);
                  this.data![newIndex].detail?.();
                }}
                class=${classMap({ current: !offset, other: !!offset })}
                part=${partMap({ current: !offset, other: !!offset })}
                style=${styleMap(
                  offset
                    ? {
                        [offset < 0 ? 'right' : 'left']: 'calc(100% + 0.75em)',
                        transform: `translate(${(offset - Math.sign(offset)) * 100}%)`,
                      }
                    : { left: 0, right: 0, transform: 'translate(0)' },
                )}
              >
                <dy-heading v-if=${!offset && !this.inert} lv="2">${item.title}</dy-heading>
                <img part="img" src=${item.img} alt="Cover" crossorigin="anonymous" />
              </div>
            `
          : html`<div></div>`,
    )}`;
  };
}
