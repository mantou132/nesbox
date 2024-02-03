import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  useStore,
} from '@mantou/gem';
import { polling } from 'duoyun-ui/lib/timer';

import { getCDNSrc } from 'src/utils/common';
import { store } from 'src/store';
import { theme } from 'src/theme';
import { enterPubRoom } from 'src/services/api';
import { getRooms } from 'src/services/guest-api';
import { i18n } from 'src/i18n/basic';

import 'duoyun-ui/elements/empty';
import 'duoyun-ui/elements/heading';
import 'src/elements/rotor';

const [mtRoomsStore, updateMtRoomsStore] = useStore({ currentId: store.roomIds?.[0] || 0 });

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column-reverse;
    padding: ${theme.gridGutter} calc(2 * ${theme.gridGutter});
  }
  nesbox-rotor::part(img) {
    border: 1px solid ${theme.borderColor};
  }
`);

/**
 * @customElement p-mt-rooms
 */
@customElement('p-mt-rooms')
@adoptedStyle(style)
@connectStore(store)
@connectStore(mtRoomsStore)
export class PMtRoomsElement extends GemElement {
  mounted = () => {
    this.effect(
      () => polling(getRooms, 10_000),
      () => [i18n.currentLanguage],
    );
  };

  render = () => {
    const index = store.roomIds?.findIndex((id) => mtRoomsStore.currentId === id) || 0;

    return html`
      ${store.roomIds?.length
        ? html`
            <nesbox-rotor
              @change=${({ detail }: CustomEvent<number>) => updateMtRoomsStore({ currentId: store.roomIds![detail] })}
              .index=${index >= 0 ? index : 0}
              .finite=${true}
              .data=${store.roomIds.map((id) => ({
                id,
                title: store.games[store.rooms[id]?.gameId || 0]?.name || '',
                img: store.rooms[id]?.screenshot || getCDNSrc(store.games[store.rooms[id]?.gameId || 0]?.preview || ''),
                handle: () => enterPubRoom(id),
              }))}
            ></nesbox-rotor>
          `
        : html`<dy-heading><dy-empty></dy-empty></dy-heading>`}
    `;
  };
}
