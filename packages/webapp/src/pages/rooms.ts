import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';

import { enterPubRoom, getRooms } from 'src/services/api';
import { store } from 'src/store';

const style = createCSSSheet(css``);

@customElement('p-rooms')
@adoptedStyle(style)
@connectStore(store)
export class PRoomsElement extends GemElement {
  mounted = () => {
    getRooms();
  };

  render = () => {
    return html`${store.roomIds?.map(
      (id) =>
        html`<div @click=${() => enterPubRoom(id)}>
          #${id} playing: ${store.games[store.rooms[id]?.gameId || 0]?.name}
        </div>`,
    )}`;
  };
}
