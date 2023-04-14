import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';
import { Toast } from 'duoyun-ui/elements/toast';

import { store } from 'src/store';
import { enterPubRoom } from 'src/services/api';
import { theme } from 'src/theme';
import { i18n } from 'src/i18n/basic';

import 'src/modules/room-item';

const style = createCSSSheet(css`
  :host {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(11em, 1fr));
    grid-template-rows: max-content;
    grid-gap: ${theme.gridGutter};
  }
`);

/**
 * @customElement m-room-list
 */
@customElement('m-room-list')
@adoptedStyle(style)
@connectStore(store)
export class MRoomListElement extends GemElement {
  #onClick = (id: number) => {
    if (store.rooms[id] && store.rooms[id]!.users.length > 4) {
      Toast.open('error', i18n.get('tip.room.crowded'));
    } else {
      enterPubRoom(id);
    }
  };

  render = () => {
    return html`${store.roomIds?.map(
      (id) =>
        store.rooms[id] &&
        html`<m-room-item .room=${store.rooms[id]!} @click=${() => this.#onClick(id)}></m-room-item>`,
    )}`;
  };
}
