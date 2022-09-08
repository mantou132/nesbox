import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css } from '@mantou/gem';
import { Time } from 'duoyun-ui/lib/time';

const style = createCSSSheet(css`
  :host {
    font-variant-numeric: tabular-nums;
  }
`);

/**
 * @customElement nesbox-time
 */
@customElement('nesbox-time')
@adoptedStyle(style)
export class NesboxTimeElement extends GemElement {
  mounted = () => {
    let timer = 0;
    const createTimer = () => {
      timer = window.setTimeout(() => {
        this.update();
        createTimer();
      }, 1000 - (Date.now() % 1000) || 1000);
    };
    createTimer();
    return () => clearTimeout(timer);
  };

  render = () => {
    return html`${new Time().format({ hour: 'numeric', minute: 'numeric' })}`;
  };
}
