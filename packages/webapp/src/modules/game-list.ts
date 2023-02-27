import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  boolattribute,
  repeat,
} from '@mantou/gem';
import { isNotNullish } from 'duoyun-ui/lib/types';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { queryKeys } from 'src/constants';
import { changeQuery } from 'src/utils';

import { store } from 'src/store';
import { i18n } from 'src/i18n';
import { theme } from 'src/theme';
import { gameKindList, gameSeriesList } from 'src/enums';
import { ScGameKind, ScGameSeries } from 'src/generated/graphql';
import { locationStore } from 'src/routes';

import 'duoyun-ui/elements/heading';
import 'duoyun-ui/elements/divider';
import 'duoyun-ui/elements/select';
import 'duoyun-ui/elements/pick';
import 'duoyun-ui/elements/use';
import 'src/modules/game-item';

const style = createCSSSheet(css`
  dy-heading {
    margin-block: 0;
  }
  dy-select,
  dy-pick {
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
  .list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(12em, 1fr));
    grid-template-rows: max-content;
    grid-gap: 2rem;
  }
  @media ${mediaQuery.PHONE} {
    .heading {
      flex-direction: column;
      align-items: start;
    }
  }
`);

/**
 * @customElement m-game-list
 */
@customElement('m-game-list')
@adoptedStyle(style)
@connectStore(store)
@connectStore(locationStore)
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
      () => [store.gameIds, locationStore.query.toString()],
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
              <dy-heading lv="3">${i18n.get('recentGame')}</dy-heading>
            </div>
            <dy-divider></dy-divider>
          `
        : this.new
        ? html`
            <div class="heading">
              <dy-heading lv="3">${i18n.get('newGame')}</dy-heading>
            </div>
            <dy-divider></dy-divider>
          `
        : this.favorite
        ? ''
        : html`
            <div class="heading">
              <dy-heading lv="3">${i18n.get('allGame')}</dy-heading>
              <span style="flex-grow: 1;"></span>
              <dy-select
                style="width: 12em;"
                .dropdownStyle=${{ width: '12em' }}
                .multiple=${true}
                .placeholder=${i18n.get('gameKind')}
                .value=${this.#gameKinds}
                .options=${gameKindList.map((e) => ({ ...e, label: i18n.get(e.label) }))}
                @change=${this.#onChangeKind}
              ></dy-select>
              <dy-pick
                .placeholder=${i18n.get('gameSeries')}
                .value=${this.#gameSeries}
                .options=${gameSeriesList.map((e) => ({ ...e, label: i18n.get(e.label) }))}
                @change=${({ detail }: CustomEvent<ScGameSeries | ''>) => changeQuery(queryKeys.GAME_SERIES, detail)}
              ></dy-pick>
              <dy-select
                .dropdownStyle=${{ width: '8em' }}
                .placeholder=${i18n.get('gameMaxPlayer')}
                .value=${this.#gamePlayer}
                .options=${['', '1', '2', '4'].map((value) => ({
                  value,
                  label: value ? i18n.get('gamePlayer', value) : i18n.get('gameNoLimit'),
                }))}
                @change=${({ detail }: CustomEvent<string>) => changeQuery(queryKeys.GAME_PLAYER, detail)}
              ></dy-select>
            </div>
            <dy-divider></dy-divider>
          `}
      <div class="list">
        ${repeat(
          this.#filteredData || [],
          (id) =>
            store.games[id] &&
            html`<m-game-item .game=${store.games[id]!} .favorited=${this.#favSet.has(id)}></m-game-item>`,
        )}
      </div>
    `;
  };
}
