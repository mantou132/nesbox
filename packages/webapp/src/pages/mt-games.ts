import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  createStore,
  updateStore,
} from '@mantou/gem';

import { store } from 'src/store';
import { theme } from 'src/theme';
import { getCDNSrc } from 'src/utils';
import { createRoom } from 'src/services/api';

import 'src/elements/rotor';

const mtGamesStore = createStore({ currentIndex: 0 });

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column-reverse;
    padding: calc(2 * ${theme.gridGutter});
  }
`);

/**
 * @customElement p-mt-games
 */
@customElement('p-mt-games')
@adoptedStyle(style)
@connectStore(store)
@connectStore(mtGamesStore)
export class PMtGamesElement extends GemElement {
  render = () => {
    return html`
      <nesbox-rotor
        @change=${({ detail }: CustomEvent<number>) => updateStore(mtGamesStore, { currentIndex: detail })}
        .index=${Math.min(mtGamesStore.currentIndex, store.gameIds ? store.gameIds.length - 1 : 0)}
        .data=${store.gameIds?.map((id) => ({
          id,
          img: store.games[id] ? getCDNSrc(store.games[id]!.preview) : '',
          handle: () => {
            createRoom({ gameId: id, private: false });
          },
        }))}
      ></nesbox-rotor>
    `;
  };
}
