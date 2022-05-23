import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';

import { createRoom, getGames } from 'src/services/api';
import { store } from 'src/store';

const style = createCSSSheet(css``);

@customElement('p-games')
@adoptedStyle(style)
@connectStore(store)
export class PGamesElement extends GemElement {
  #onGameClick = async (gameId: number) => {
    await createRoom({ gameId, private: false });
  };

  mounted = () => {
    getGames();
  };

  render = () => {
    return html`${store.gameIds?.map(
      (id) => html`<div @click=${() => this.#onGameClick(id)}>#${id} ${store.games[id]?.name}</div>`,
    )}`;
  };
}
