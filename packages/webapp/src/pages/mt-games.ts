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
  state,
  repeat,
} from '@mantou/gem';
import { formatDuration, Time } from 'duoyun-ui/lib/time';
import { getCDNSrc, playHintSound } from 'src/utils';
import { locationStore } from 'src/routes';

import { globalEvents, queryKeys } from 'src/constants';
import { store } from 'src/store';
import { theme } from 'src/theme';
import { createRoom, getComments } from 'src/services/api';
import { GamepadBtnIndex } from 'src/gamepad';
import { updateMtApp } from 'src/mt-app';
import { i18n } from 'src/i18n';
import { icons } from 'src/icons';

import 'duoyun-ui/elements/divider';
import 'duoyun-ui/elements/empty';
import 'duoyun-ui/elements/heading';
import 'src/modules/game-detail';
import 'src/elements/rotor';
import 'src/elements/scroll';

const mtGamesStore = createStore({ currentIndex: 0, focusId: 0 });

const style = createCSSSheet(css`
  :host {
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
  :host(:where([data-detail], :--detail)) {
    --size: min(calc(100vh - 10em), 20em, 28vw);
  }
  :host(:where([data-detail], :--detail)) .rotor {
    height: var(--size);
  }
  :host(:where([data-detail], :--detail)) nesbox-rotor {
    width: var(--size);
  }
  :host(:where([data-detail], :--detail)) nesbox-rotor::part(other) {
    opacity: 0;
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
`);

/**
 * @customElement p-mt-games
 */
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
    updateStore(mtGamesStore, { focusId: gameId });
    getComments(gameId);
  };

  #pressButton = (evt: CustomEvent<GamepadBtnIndex>) => {
    if (!mtGamesStore.focusId) return;
    switch (evt.detail) {
      case GamepadBtnIndex.FrontLeftTop:
        playHintSound();
        updateStore(mtGamesStore, { focusId: 0 });
        break;
    }
  };

  #queryWatching = false;
  mounted = () => {
    this.effect(
      (args) => {
        if (this.#queryWatching || args![0]) {
          updateStore(mtGamesStore, { focusId: 0, currentIndex: 0 });
        } else {
          this.#queryWatching = true;
        }
      },
      () => [locationStore.query.get(queryKeys.RECENT_GAMES)],
    );

    this.effect(() => {
      updateMtApp({ inertNav: !!mtGamesStore.focusId });
    });

    this.addEventListener('dblclick', () => updateStore(mtGamesStore, { focusId: 0 }));

    addEventListener(globalEvents.PRESS_HOST_BUTTON_INDEX, this.#pressButton);
    return () => {
      removeEventListener(globalEvents.PRESS_HOST_BUTTON_INDEX, this.#pressButton);
      updateMtApp({ inertNav: false });
      updateStore(mtGamesStore, { focusId: 0 });
    };
  };

  render = () => {
    this.detail = !!mtGamesStore.focusId;

    const game = store.games[mtGamesStore.focusId];
    const record = store.record[mtGamesStore.focusId];

    return html`
      <div class="rotor">
        ${this.#data?.length
          ? html`${repeat(
              [locationStore.query.toString()],
              (key) => key,
              () => html`
                <nesbox-rotor
                  ?inert=${!!mtGamesStore.focusId}
                  .finite=${this.#data!.length < 3}
                  @change=${({ detail }: CustomEvent<number>) => updateStore(mtGamesStore, { currentIndex: detail })}
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
          : html`<dy-heading><dy-empty></dy-empty></dy-heading>`}
        ${mtGamesStore.focusId && record
          ? html`
              <div class="stats">
                <dy-use class="stats-icon" .element=${icons.date}>
                  ${i18n.get('gameLastPlay', new Time().relativeTimeFormat(record.lastPlayStartAt))}
                </dy-use>
                <dy-use class="stats-icon" .element=${icons.schedule}>
                  ${i18n.get('gameTotalPlay', formatDuration(record.playTotal))}
                </dy-use>
              </div>
            `
          : ''}
      </div>
      ${mtGamesStore.focusId && game
        ? html`
            <nesbox-scroll class="info">
              <dy-heading lv="1">${game.name}</dy-heading>
              <dy-divider></dy-divider>
              <m-game-detail .md=${game.description}></m-game-detail>
            </nesbox-scroll>
          `
        : ''}
    `;
  };
}
