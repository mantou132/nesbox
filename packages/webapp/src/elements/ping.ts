import { GemElement, html, adoptedStyle, customElement, createStore, connectStore, updateStore } from '@mantou/gem';

import { fpsStyle } from 'src/elements/fps';

const recentPing: number[] = [];

const store = createStore({
  avgPing: 0,
});

export const clearRecentPing = () => (recentPing.length = 0);

export const pingTick = (ping: number) => {
  recentPing.push(ping);
  if (recentPing.length > 10) {
    recentPing.shift();
  }

  updateStore(store, {
    avgPing: Math.round(recentPing.reduce((acc, val) => (acc += val)) / recentPing.length),
  });
};

/**
 * @customElement nesbox-ping
 */
@customElement('nesbox-ping')
@adoptedStyle(fpsStyle)
@connectStore(store)
export class NesboxPingElement extends GemElement {
  render = () => {
    if (recentPing.length < 3) return html``;
    return html`Ping: ${store.avgPing}ms`;
  };
}
