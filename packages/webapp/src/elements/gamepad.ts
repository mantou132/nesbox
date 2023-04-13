import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  property,
  emitter,
  Emitter,
  classMap,
} from '@mantou/gem';

import gamepadImg from 'src/images/gamepad2.svg?raw';
import { theme } from 'src/theme';

import 'duoyun-ui/elements/shortcut-record';
import 'duoyun-ui/elements/use';

const style = createCSSSheet(css`
  :host {
    display: block;
    width: 100%;
    position: relative;
  }
  .img {
    width: 100%;
    padding-inline: 10%;
    box-sizing: border-box;
  }
  .key {
    cursor: pointer;
    position: absolute;
    border: none;
    height: auto;
    width: auto;
    padding: calc(0.1em + 2px) 0.1em;
    transform: translate(-50%, -50%);
  }
  .key:focus {
    background-color: ${theme.informativeColor};
  }
  .key:not(:focus) {
    text-shadow: 0 0.5px #0003;
    filter: drop-shadow(0.1em 0.3em 0.4em black);
  }
  .key::part(kbd) {
    background-color: transparent;
    border-color: transparent;
    font-weight: bold;
  }
  .up {
    top: 45.5%;
    left: 29.4%;
  }
  .left {
    top: 51.3%;
    left: 23.9%;
  }
  .down {
    top: 58%;
    left: 29.4%;
  }
  .right {
    top: 51.3%;
    left: 34.1%;
  }
  .b {
    top: 59.6%;
    left: 66.6%;
  }
  .a {
    top: 54.5%;
    left: 73.4%;
  }
  .c {
    top: 49.9%;
    left: 80%;
  }
  .turbob {
    top: 51.9%;
    left: 62.1%;
  }
  .turboa {
    top: 47.3%;
    left: 68.1%;
  }
  .turboc {
    top: 43.1%;
    left: 73.9%;
  }
  .select {
    top: 58.6%;
    left: 45.7%;
  }
  .start {
    top: 58.6%;
    left: 53%;
  }
  .reset {
    top: 47.5%;
    left: 50%;
  }
`);

export type GamePadValue = {
  Up: string;
  Left: string;
  Down: string;
  Right: string;
  A: string;
  B: string;
  C: string;
  TurboA: string;
  TurboB: string;
  TurboC: string;
  Select: string;
  Start: string;
  Reset: string;
};

/**
 * @customElement nesbox-gamepad
 */
@customElement('nesbox-gamepad')
@adoptedStyle(style)
export class NesboxGamepadElement extends GemElement {
  @property value?: GamePadValue;

  @emitter change: Emitter<GamePadValue>;

  #getJoypadKey = (keys: string[]) => {
    return keys.find((e) => e.length === 1 || e.startsWith('arrow')) || '';
  };

  render = () => {
    return html`
      <dy-use class="img" .element=${gamepadImg}></dy-use>
      ${this.value
        ? Object.entries(this.value).map(([name, value]) =>
            value
              ? html`
                  <dy-shortcut-record
                    class=${classMap({ key: true, [name.toLowerCase()]: true })}
                    .value=${[value]}
                    @change=${(evt: CustomEvent<string[]>) => {
                      evt.stopPropagation();
                      const key = this.#getJoypadKey(evt.detail);
                      if (key) {
                        this.change({ ...this.value!, [name]: key });
                      }
                    }}
                  ></dy-shortcut-record>
                `
              : html`
                  <style>
                    .img::part(${name.toLowerCase()}) {
                      display: none;
                    }
                  </style>
                `,
          )
        : ''}
    `;
  };
}
