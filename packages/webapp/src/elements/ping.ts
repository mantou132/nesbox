import { GemElement, html, adoptedStyle, customElement, connectStore } from '@mantou/gem';

import { fpsStyle } from 'src/elements/fps';
import { pingStore } from 'src/rtc';

/**
 * @customElement nesbox-ping
 */
@customElement('nesbox-ping')
@adoptedStyle(fpsStyle)
@connectStore(pingStore)
export class NesboxPingElement extends GemElement {
  render = () => {
    if (!pingStore.avgPing) return html``;
    return html`Ping: ${pingStore.avgPing}ms`;
  };
}
