import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, raw } from '@mantou/gem';

import 'duoyun-ui/elements/use';

const batteryIcon = raw`
  <svg viewBox="0 0 24 24" fill="currentColor">
    <rect fill="none" height="24" width="24"/>
    <path d="M17,5v16c0,0.55-0.45,1-1,1H8c-0.55,0-1-0.45-1-1V5c0-0.55,0.45-1,1-1h2V2h4v2h2C16.55,4,17,4.45,17,5z"/>
    <path d="M15,6H9v4h6V6z"/>
  </svg>
`;

const style = createCSSSheet(css`
  :host {
    display: contents;
  }
  dy-use {
    width: 1.2em;
    transform: rotate(90deg);
  }
`);

/**
 * @customElement nesbox-battery
 */
@customElement('nesbox-battery')
@adoptedStyle(style)
export class NesboxBatteryElement extends GemElement {
  render = () => {
    return html`<dy-use .element=${batteryIcon}></dy-use>`;
  };
}
