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

import { store } from 'src/store';
import { i18n } from 'src/i18n';

import 'duoyun-ui/elements/heading';
import 'duoyun-ui/elements/use';
import 'src/modules/game-item';

const style = createCSSSheet(css`
  dy-heading {
    margin-block: 0 1em;
  }
  .list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(12em, 1fr));
    grid-template-rows: max-content;
    grid-gap: 2rem;
  }
`);

/**
 * @customElement m-game-list
 */
@customElement('m-game-list')
@adoptedStyle(style)
@connectStore(store)
@connectStore(i18n.store)
export class MGameListElement extends GemElement {
  @boolattribute favorite: boolean;
  @boolattribute recent: boolean;
  @boolattribute new: boolean;

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
    if (this.new) {
      return store.gameIds?.slice(store.gameIds.length - 4).reverse();
    } else if (this.recent) {
      return store.recentGameIds?.slice(0, 4);
    } else if (this.favorite) {
      return store.favoriteIds;
    } else {
      return store.gameIds;
    }
  }

  render = () => {
    if (!this.#data?.length) {
      return html`
        <style>
          :host {
            display: none;
          }
        </style>
      `;
    }
    return html`
      ${this.recent
        ? html`<dy-heading lv="3">${i18n.get('recentGame')}</dy-heading>`
        : this.new
        ? html`<dy-heading lv="3">${i18n.get('newGame')}</dy-heading>`
        : this.favorite
        ? ''
        : html`<dy-heading lv="3">${i18n.get('allGame')}</dy-heading>`}
      <div class="list">
        ${this.#data?.map(
          (id) =>
            store.games[id] &&
            html`<m-game-item .game=${store.games[id]!} .favorited=${this.#favSet.has(id)}></m-game-item>`,
        )}
      </div>
    `;
  };
}
