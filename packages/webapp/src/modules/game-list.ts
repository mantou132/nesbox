import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  boolattribute,
} from '@mantou/gem';

import { theme } from 'src/theme';
import { store } from 'src/store';

import 'src/modules/game-item';

const style = createCSSSheet(css`
  :host {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(10em, 1fr));
    grid-template-rows: max-content;
    grid-gap: ${theme.gridGutter};
    padding-inline: ${theme.gridGutter};
  }
`);

/**
 * @customElement m-game-list
 */
@customElement('m-game-list')
@adoptedStyle(style)
@connectStore(store)
export class MGameListElement extends GemElement {
  @boolattribute favorite: boolean;

  constructor() {
    super();
    this.memo(
      () => {
        this.#favSet = new Set(store.favoriteIds);
      },
      () => [store.favoriteIds],
    );
  }

  #favSet = new Set(store.favoriteIds);

  get #data() {
    if (this.favorite) {
      return store.favoriteIds;
    } else {
      return store.gameIds;
    }
  }

  render = () => {
    return html`${this.#data?.map(
      (id) =>
        store.games[id] &&
        html`<m-game-item .game=${store.games[id]!} .favorited=${this.#favSet.has(id)}></m-game-item>`,
    )}`;
  };
}
