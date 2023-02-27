import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, raw, state } from '@mantou/gem';
import { genIcon } from 'duoyun-ui/lib/icons';

import 'duoyun-ui/elements/use';

const onlineIcon = raw`
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 0h24v24H0V0zm0 0h24v24H0V0z" fill="none"/>
      <path part="g2" d="M9 17 12 20 15 17C13.35 15.34 10.66 15.34 9 17Z"/>
      <path part="g3" d="M5 13 7 15C9.76 12.24 14.24 12.24 17 15L19 13C15.14 9.14 8.87 9.14 5 13Z"/>
      <path part="g4" d="M1 9 3 11C7.97 6.03 16.03 6.03 21 11L23 9C16.93 2.93 7.08 2.93 1 9Z"/>
    </svg>
`;

const offlineIcon = genIcon(
  `M22.99 9C19.15 5.16 13.8 3.76 8.84 4.78l2.52 2.52c3.47-.17 6.99 1.05 9.63 3.7l2-2zm-4 4c-1.29-1.29-2.84-2.13-4.49-2.56l3.53 3.53.96-.97zM2 3.05L5.07 6.1C3.6 6.82 2.22 7.78 1 9l1.99 2c1.24-1.24 2.67-2.16 4.2-2.77l2.24 2.24C7.81 10.89 6.27 11.73 5 13v.01L6.99 15c1.36-1.36 3.14-2.04 4.92-2.06L18.98 20l1.27-1.26L3.29 1.79 2 3.05zM9 17l3 3 3-3c-1.65-1.66-4.34-1.66-6 0z`,
);

const style = createCSSSheet(css`
  :host {
    display: contents;
  }
  dy-use {
    width: 1.2em;
  }
`);

/**
 * @customElement nesbox-net
 */
@customElement('nesbox-net')
@adoptedStyle(style)
export class NesboxNetElement extends GemElement {
  @state effective: boolean;

  mounted = () => {
    navigator.connection?.addEventListener('change', this.update);
    addEventListener('online', this.update);
    addEventListener('offline', this.update);
    return () => {
      navigator.connection?.removeEventListener('change', this.update);
      removeEventListener('online', this.update);
      removeEventListener('offline', this.update);
    };
  };

  render = () => {
    const effectiveType = navigator.connection?.effectiveType;
    const selector =
      effectiveType === 'slow-2g' || effectiveType === '2g'
        ? 'dy-use::part(g3), dy-use::part(g4)'
        : effectiveType === '3g'
        ? 'dy-use::part(g4)'
        : 'none';

    return html`
      <style>
        ${selector} {
          opacity: 0.5;
        }
      </style>
      <dy-use .element=${navigator.onLine ? onlineIcon : offlineIcon}></dy-use>
    `;
  };
}
