import {
  addListener,
  adoptedStyle,
  connectStore,
  createStore,
  css,
  customElement,
  effect,
  GemElement,
  html,
  mounted,
  repeat,
  state,
} from '@mantou/gem';
import { formatDuration, Time } from 'duoyun-ui/lib/time';
import { globalEvents, queryKeys } from 'src/constants';
import { GamepadBtnIndex } from 'src/gamepad';
import { i18n } from 'src/i18n/basic';
import { icons } from 'src/icons';
import { mtAppStore } from 'src/mt-app';
import { locationStore } from 'src/routes';
import { createRoom, getRecord } from 'src/services/api';
import { getComments } from 'src/services/guest-api';
import { store } from 'src/store';
import { theme } from 'src/theme';
import { getCDNSrc, playHintSound } from 'src/utils/common';

import 'duoyun-ui/elements/divider';
import 'duoyun-ui/elements/empty';
import 'duoyun-ui/elements/heading';
import 'src/elements/rotor';
import 'src/elements/scroll';
import 'src/modules/game-detail';

const mtGamesStore = createStore({ currentIndex: 0, focusId: 0 });

const style = css`
  :scope {
    min-height: 0;
    display: flex;
    gap: calc(2 * ${theme.gridGutter});
    padding: ${theme.gridGutter} calc(2 * ${theme.gridGutter});
    height: 100%;
    box-sizing: border-box;
  }
  .rotor {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column-reverse;
    height: 100%;
    transition: all 0.3s ${theme.timingFunction};
  }
  :scope:state(detail) {
    --size: min(calc(100vh - 10em), 20em, 28vw);

    .rotor {
      height: var(--size);
    }
    nesbox-rotor {
      width: var(--size);
    }
    nesbox-rotor::part(other) {
      opacity: 0;
    }
  }
  .info,
  .stats {
    animation: 0.3s ${theme.timingFunction} 0.3s forwards show;
  }
  @keyframes show {
    to {
      opacity: 1;
    }
  }
  .stats {
    position: absolute;
    top: 100%;
    left: 0;
    width: 100%;
    height: max-content;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    padding-block-start: 1em;
    opacity: 0;
  }
  .stats-icon {
    gap: 0.2em;
    white-space: nowrap;
  }
  .stats ::part(icon) {
    width: 1.2em;
  }
  .info {
    flex-grow: 1;
    opacity: 0;
  }
  .info :first-child {
    margin-block-start: 0;
  }
`;

@customElement('p-mt-games')
@adoptedStyle(style)
@connectStore(store)
@connectStore(locationStore)
@connectStore(mtGamesStore)
export class PMtGamesElement extends GemElement {
  @state detail: boolean;

  get #data() {
    const { query } = locationStore;
    if (query.get(queryKeys.RECENT_GAMES)) return store.recentGameIds;
    return store.favoriteIds;
  }

  #onDetail = (gameId: number) => {
    mtGamesStore({ focusId: gameId });
    getComments(gameId);
    getRecord(gameId);
  };

  #pressButton = (evt: CustomEvent<GamepadBtnIndex>) => {
    if (!mtGamesStore.focusId) return;
    switch (evt.detail) {
      case GamepadBtnIndex.FrontLeftTop:
      case GamepadBtnIndex.A:
      case GamepadBtnIndex.B:
        playHintSound();
        mtGamesStore({ focusId: 0 });
        break;
    }
  };

  #queryWatching = false;
  @effect(() => [locationStore.query.get(queryKeys.RECENT_GAMES)])
  #updateWatching = (args: [string | null]) => {
    if (this.#queryWatching || args![0]) {
      mtGamesStore({ focusId: 0, currentIndex: 0 });
    } else {
      this.#queryWatching = true;
    }
  };

  @effect()
  #updateNav = () => {
    mtAppStore({ inertNav: !!mtGamesStore.focusId });
  };

  @mounted()
  #init = () => {
    this.addEventListener('dblclick', () => mtGamesStore({ focusId: 0 }));
    const removeHandle = addListener(window, globalEvents.PRESS_HOST_BUTTON_INDEX, this.#pressButton);

    return () => {
      removeHandle();
      mtAppStore({ inertNav: false });
      mtGamesStore({ focusId: 0 });
    };
  };

  render = () => {
    this.detail = !!mtGamesStore.focusId;

    const game = store.games[mtGamesStore.focusId];
    const record = store.record[mtGamesStore.focusId];

    return html`
      <div class="rotor">
        ${
          this.#data?.length
            ? html`${repeat(
                [locationStore.query.toString()],
                (key) => key,
                () => html`
                <nesbox-rotor
                  ?inert=${!!mtGamesStore.focusId}
                  .finite=${this.#data!.length < 3}
                  @change=${({ detail }: CustomEvent<number>) => mtGamesStore({ currentIndex: detail })}
                  .index=${Math.min(mtGamesStore.currentIndex, this.#data!.length - 1)}
                  .data=${this.#data!.map((id) => ({
                    id,
                    title: store.games[id]?.name || '',
                    img: store.games[id] ? getCDNSrc(store.games[id]!.preview) : '',
                    handle: () => createRoom({ gameId: id, private: false }),
                    detail: () => this.#onDetail(id),
                  }))}
                ></nesbox-rotor>
              `,
              )}`
            : html`<dy-heading><dy-empty></dy-empty></dy-heading>`
        }
        <div v-if=${!!mtGamesStore.focusId && !!record} class="stats">
          <dy-use class="stats-icon" .element=${icons.date}>
            ${i18n.get('page.game.lastPlay', new Time().relativeTimeFormat(record?.lastPlayStartAt || 0))}
          </dy-use>
          <dy-use class="stats-icon" .element=${icons.schedule}>
            ${i18n.get('page.game.totalPlay', formatDuration(record?.playTotal || 0, { precision: 'm' }))}
          </dy-use>
        </div>
      </div>
      <nesbox-scroll v-if=${!!mtGamesStore.focusId && !!game} class="info">
        <dy-heading lv="1">${game?.name}</dy-heading>
        <dy-divider></dy-divider>
        <m-game-detail .game=${game}></m-game-detail>
      </nesbox-scroll>
    `;
  };
}
