import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, raw } from '@mantou/gem';

import { theme } from 'src/theme';

import 'duoyun-ui/elements/use';

const batteryIcon = raw`
  <svg viewBox="0 0 24 24" fill="currentColor">
    <rect fill="none" height="24" width="24"/>
    <path d="M17,5v16c0,0.55-0.45,1-1,1H8c-0.55,0-1-0.45-1-1V5c0-0.55,0.45-1,1-1h2V2h4v2h2C16.55,4,17,4.45,17,5z"/>
    <path part="used" d="M15,6H9v4h6V6z"/>
    <path part="charging" d="M14.5 11l-3 6v-4h-2l3-6v4z" />
  </svg>
`;

const style = createCSSSheet(css`
  :host {
    display: contents;
  }
  dy-use {
    width: 1.2em;
    transform: rotate(90deg) scale(1.2, 1.1);
  }
  dy-use::part(used) {
    fill: ${theme.backgroundColor};
    transform-origin: right top;
    transform-box: fill-box;
  }
  dy-use::part(charging) {
    fill: ${theme.backgroundColor};
    stroke-width: 3px;
    paint-order: stroke;
    stroke: currentColor;
  }
`);

type State = {
  level: number;
  charging: boolean;
};

/**
 * @customElement nesbox-battery
 */
@customElement('nesbox-battery')
@adoptedStyle(style)
export class NesboxBatteryElement extends GemElement<State> {
  state: State = {
    charging: false,
    level: 1,
  };

  #onChange = () => {
    navigator.getBattery().then(({ level, charging }) => {
      this.setState({ level, charging });
    });
  };

  mounted = () => {
    this.#onChange();
    navigator.getBattery().then((bm) => {
      bm.addEventListener('levelchange', this.#onChange);
      bm.addEventListener('chargingchange', this.#onChange);
    });
    return () => {
      navigator.getBattery().then((bm) => {
        bm.removeEventListener('levelchange', this.#onChange);
        bm.removeEventListener('chargingchange', this.#onChange);
      });
    };
  };

  render = () => {
    const { charging, level } = this.state;
    return html`
      <style>
        dy-use {
          color: ${level < 0.1 ? theme.negativeColor : theme.textColor};
        }
        dy-use::part(used) {
          transform: scaleY(${Math.min(Math.floor((1 - level) / 0.25), 3.45)});
        }
        dy-use::part(charging) {
          display: ${charging ? 'block' : 'none'};
        }
      </style>
      <dy-use .element=${batteryIcon}></dy-use>
    `;
  };
}
