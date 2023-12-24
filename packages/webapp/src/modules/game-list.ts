import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  boolattribute,
  styleMap,
  numattribute,
  RefObject,
  refobject,
  history,
} from '@mantou/gem';
import { isNotNullish } from 'duoyun-ui/lib/types';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { locationStore } from 'src/routes';
import { isMtApp } from '@nesbox/mtapp';

import { changeQuery } from 'src/utils/common';
import { queryKeys } from 'src/constants';
import { store } from 'src/store';
import { i18n } from 'src/i18n/basic';
import { theme } from 'src/theme';
import { gameKindList, gameSeriesList } from 'src/enums';
import { ScGameKind, ScGameSeries } from 'src/generated/graphql';
import { icons } from 'src/icons';

import type { DuoyunListElement, PersistentState } from 'duoyun-ui/elements/list';

import 'duoyun-ui/elements/heading';
import 'duoyun-ui/elements/divider';
import 'duoyun-ui/elements/select';
import 'duoyun-ui/elements/picker';
import 'duoyun-ui/elements/list';
import 'duoyun-ui/elements/use';
import 'src/modules/game-item';

const style = createCSSSheet(css`
  dy-heading {
    margin-block: 0;
  }
  dy-select,
  dy-picker {
    width: 8em;
    padding-block: 0;
    border: none;
    background-color: ${theme.hoverBackgroundColor};
  }
  dy-divider {
    margin-block-start: calc(${theme.gridGutter} / 2);
    margin-block-end: ${theme.gridGutter};
  }
  .heading {
    display: flex;
    align-items: center;
    gap: 1em;
  }
  .list::part(list) {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(12em, 1fr));
    grid-template-rows: max-content;
    grid-gap: 2rem;
  }
  @media ${mediaQuery.PHONE} {
    .list {
      grid-template-columns: repeat(auto-fill, minmax(8em, 1fr));
      grid-gap: ${theme.gridGutter};
    }
  }
`);

// 只缓存 all 列表，不然串数据
let persistentState: PersistentState | undefined;

/**
 * @customElement m-game-list
 */
@customElement('m-game-list')
@adoptedStyle(style)
@connectStore(store)
@connectStore(locationStore)
@connectStore(history.store)
@connectStore(i18n.store)
export class MGameListElement extends GemElement {
  @refobject listRef: RefObject<DuoyunListElement>;

  @boolattribute favorite: boolean;
  @boolattribute recent: boolean;
  @boolattribute new: boolean;
  @boolattribute all: boolean;
  @numattribute length: number;

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
      return store.gameIds?.slice(store.gameIds.length - this.length).reverse();
    } else if (this.recent) {
      return store.recentGameIds?.slice(0, this.length);
    } else if (this.favorite) {
      return store.favoriteIds;
    } else {
      return store.gameIds;
    }
  }

  get #gameKinds() {
    return locationStore.query.getAll(queryKeys.GAME_KIND);
  }

  get #gameSeries() {
    return locationStore.query.get(queryKeys.GAME_SERIES);
  }

  get #gamePlayer() {
    return locationStore.query.get(queryKeys.GAME_PLAYER);
  }

  #onChangeKind = ({ detail }: CustomEvent<(ScGameKind | '')[]>) => {
    if (detail.includes('')) {
      changeQuery(queryKeys.GAME_KIND, null);
    } else {
      changeQuery(queryKeys.GAME_KIND, detail.filter(isNotNullish));
    }
  };

  #renderItem = (id: number) => {
    const game = store.games[id];
    if (!game) return html``;
    return html`<m-game-item .game=${game} .favorited=${this.#favSet.has(id)}></m-game-item>`;
  };

  #getKey = (id: number) => id;

  #filteredData?: number[] = [];
  willMount = () => {
    this.memo(
      () => {
        if (this.#data === store.gameIds) {
          this.#filteredData = this.#data?.filter((id) => {
            const game = store.games[id];
            if (!game) return true;
            const kinds = this.#gameKinds
              .map((k) =>
                k === ScGameKind.Rts
                  ? [k, ScGameKind.Tbs, ScGameKind.Slg, ScGameKind.Tbg]
                  : k === ScGameKind.Other
                  ? [k, ScGameKind.Pzg, ScGameKind.Rcg]
                  : k,
              )
              .flat();
            const series = this.#gameSeries;
            const players = this.#gamePlayer;
            return (
              (!kinds.length || (game.kind && kinds.includes(game.kind))) &&
              (!series || game.series === series) &&
              (!players || game.maxPlayer === Number(players))
            );
          });
        } else {
          this.#filteredData = this.#data;
        }
      },
      () => [
        this.length,
        store.topGameIds,
        // mt app need immediately update
        isMtApp && store.favoriteIds,
        // filter
        this.all ? locationStore.query.toString() : '',
      ],
    );
  };

  mounted = () => {
    this.effect(
      () => {
        if (this.all) {
          persistentState = this.listRef.element?.persistentState;
        }
      },
      () => [history.getParams().path],
    );
  };

  render = () => {
    if ((this.recent || this.new) && (!this.#data || this.#data.length < 4)) {
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
        ? html`
            <div class="heading">
              <dy-heading lv="3">${i18n.get('page.games.recent')}</dy-heading>
            </div>
            <dy-divider></dy-divider>
          `
        : this.new
        ? html`
            <div class="heading">
              <dy-heading lv="3">${i18n.get('page.games.new')}</dy-heading>
            </div>
            <dy-divider></dy-divider>
          `
        : this.favorite
        ? ''
        : html`
            <div class="heading">
              <dy-heading lv="3">${i18n.get('page.games.all')}</dy-heading>
              <span style="flex-grow: 1;"></span>
              ${mediaQuery.isPhone
                ? html`
                    <dy-use
                      .element=${icons.tune}
                      style=${styleMap({ width: '1.5em', position: 'relative', overflow: 'hidden' })}
                    >
                      <select
                        multiple
                        style=${styleMap({ opacity: 0, position: 'absolute', inset: '0' })}
                        @change=${({ target }: Event) =>
                          this.#onChangeKind(
                            new CustomEvent('', {
                              detail: [...(target as HTMLSelectElement).options]
                                .filter((e) => e.selected)
                                .map((e) => e.value as ScGameKind),
                            }),
                          )}
                      >
                        ${gameKindList.map((e) => html`<option value=${e.value}>${i18n.get(e.label)}</option>`)}
                      </select>
                    </dy-use>
                  `
                : html`
                    <dy-select
                      style="width: 12em;"
                      .dropdownStyle=${{ width: '12em' }}
                      .multiple=${true}
                      .placeholder=${i18n.get('page.game.kind')}
                      .value=${this.#gameKinds}
                      .options=${gameKindList.map((e) => ({ ...e, label: i18n.get(e.label) }))}
                      @change=${this.#onChangeKind}
                    ></dy-select>
                    <dy-picker
                      .placeholder=${i18n.get('page.game.series')}
                      .value=${this.#gameSeries}
                      .options=${gameSeriesList.map((e) => ({ ...e, label: i18n.get(e.label) }))}
                      @change=${({ detail }: CustomEvent<ScGameSeries | ''>) =>
                        changeQuery(queryKeys.GAME_SERIES, detail)}
                    ></dy-picker>
                    <dy-select
                      .dropdownStyle=${{ width: '8em' }}
                      .placeholder=${i18n.get('page.game.maxPlayer')}
                      .value=${this.#gamePlayer}
                      .options=${['', '1', '2', '4'].map((value) => ({
                        value,
                        label: value ? i18n.get('page.game.player', value) : i18n.get('global.noLimit'),
                      }))}
                      @change=${({ detail }: CustomEvent<string>) => changeQuery(queryKeys.GAME_PLAYER, detail)}
                    ></dy-select>
                  `}
            </div>
            <dy-divider></dy-divider>
          `}
      <dy-list
        class="list"
        ref=${this.listRef.ref}
        .items=${this.#filteredData}
        .key=${store.favoriteIds}
        .infinite=${this.all}
        .getKey=${this.#getKey}
        .renderItem=${this.#renderItem}
        .persistentState=${this.all ? persistentState : undefined}
      ></dy-list>
    `;
  };
}
