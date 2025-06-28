import { adoptedStyle, connectStore, createStore, css, customElement, effect, GemElement, html } from '@mantou/gem';
import { polling } from 'duoyun-ui/lib/timer';
import { i18n } from 'src/i18n/basic';
import { enterPubRoom } from 'src/services/api';
import { getRooms } from 'src/services/guest-api';
import { store } from 'src/store';
import { theme } from 'src/theme';
import { getCDNSrc } from 'src/utils/common';

import 'duoyun-ui/elements/empty';
import 'duoyun-ui/elements/heading';
import 'src/elements/rotor';

const mtRoomsStore = createStore({ currentId: store.roomIds?.[0] || 0 });

const style = css`
  :scope {
    display: flex;
    flex-direction: column-reverse;
    padding: ${theme.gridGutter} calc(2 * ${theme.gridGutter});
  }
  nesbox-rotor::part(img) {
    border: 1px solid ${theme.borderColor};
  }
`;

@customElement('p-mt-rooms')
@adoptedStyle(style)
@connectStore(store)
@connectStore(mtRoomsStore)
export class PMtRoomsElement extends GemElement {
  @effect(() => [i18n.currentLanguage])
  #init = () => polling(getRooms, 10_000);

  render = () => {
    const index = store.roomIds?.findIndex((id) => mtRoomsStore.currentId === id) || 0;

    return html`
      <nesbox-rotor
        v-if=${!!store.roomIds?.length}
        @change=${({ detail }: CustomEvent<number>) => mtRoomsStore({ currentId: store.roomIds?.[detail] })}
        .index=${index >= 0 ? index : 0}
        .finite=${true}
        .data=${store.roomIds?.map((id) => ({
          id,
          title: store.games[store.rooms[id]?.gameId || 0]?.name || '',
          img: store.rooms[id]?.screenshot || getCDNSrc(store.games[store.rooms[id]?.gameId || 0]?.preview || ''),
          handle: () => enterPubRoom(id),
        }))}
      ></nesbox-rotor>
      <dy-heading v-else><dy-empty></dy-empty></dy-heading>
    `;
  };
}
