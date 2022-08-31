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

import gamepadImg from 'src/images/gamepad.svg?raw';
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
  .key::part(kbd) {
    background-color: transparent;
    border-color: transparent;
    font-weight: bold;
  }
  .up {
    top: 31.5%;
    left: 25.4%;
  }
  .left {
    top: 37.3%;
    left: 20.9%;
  }
  .down {
    top: 43%;
    left: 25.4%;
  }
  .right {
    top: 37.3%;
    left: 30.1%;
  }
  .a {
    top: 45.5%;
    left: 75%;
  }
  .b {
    top: 37.1%;
    left: 68.1%;
  }
  .turboa {
    top: 37.1%;
    left: 81.9%;
  }
  .turbob {
    top: 28.7%;
    left: 74.9%;
  }
  .select {
    top: 45.8%;
    left: 44.7%;
  }
  .start {
    top: 45.8%;
    left: 55%;
  }
  .reset {
    top: 35.5%;
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
  TurboA: string;
  TurboB: string;
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
