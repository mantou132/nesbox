import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  styleMap,
  raw,
  RefObject,
  refobject,
  history,
} from '@mantou/gem';
import { locale } from 'duoyun-ui/lib/locale';
import { isIncludesString } from 'duoyun-ui/lib/utils';
import { isNotNullish } from 'duoyun-ui/lib/types';
import { getDisplayKey, hotkeys, isMac } from 'duoyun-ui/lib/hotkeys';
import { routes } from 'src/routes';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { createPath } from 'duoyun-ui/elements/route';

import { getCDNSrc, getTempText, matchRoute } from 'src/utils/common';
import { friendStore, store, toggleFriendChatState } from 'src/store';
import { theme } from 'src/theme';
import { i18n } from 'src/i18n/basic';
import { icons } from 'src/icons';
import { configure, getShortcut, SearchCommand, setSearchCommand, toggleSearchState } from 'src/configure';
import { createInvite, createRoom, enterPubRoom, updateRoom } from 'src/services/api';
import { paramKeys } from 'src/constants';

import type { DuoyunInputElement } from 'duoyun-ui/elements/input';
import type { DuoyunOptionsElement, Option } from 'duoyun-ui/elements/options';

import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/options';
import 'duoyun-ui/elements/alert';
import 'duoyun-ui/elements/list';
import 'duoyun-ui/elements/space';
import 'duoyun-ui/elements/paragraph';

const style = createCSSSheet(css`
  :host {
    border-radius: ${theme.normalRound};
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: min(calc(100vw - 2 * ${theme.gridGutter}), 30em);
    height: 70vh;
    font-size: 1.125em;
  }
  .header {
    background-color: ${theme.backgroundColor};
    padding: 0.6em;
  }
  .input {
    width: 100%;
    font-size: 1.075em;
    border-radius: ${theme.smallRound};
  }
  .result {
    display: flex;
    flex-direction: column;
    min-height: 0;
    flex-grow: 1;
  }
  .placeholder {
    flex-grow: 1;
    flex-shrink: 1;
  }
  .options {
    box-sizing: border-box;
    background-color: ${theme.backgroundColor};
    max-height: 100%;
    margin-block-start: -0.6em;
    border: none;
    scrollbar-width: none;
  }
  .options::-webkit-scrollbar {
    width: 0;
  }
`);

type State = {
  search: string;
  result: Option[];
};

/**
 * @customElement m-search
 */
@customElement('m-search')
@adoptedStyle(style)
@connectStore(store)
@connectStore(i18n.store)
@connectStore(friendStore)
@connectStore(configure)
export class MSearchElement extends GemElement<State> {
  @refobject options: RefObject<DuoyunOptionsElement>;
  @refobject input: RefObject<DuoyunInputElement>;

  state: State = {
    search: '',
    result: [],
  };

  get #isRooms() {
    return matchRoute(routes.rooms);
  }

  get #playing() {
    return configure.user?.playing;
  }

  #helpMessages: string[] = [];

  #onChange = ({ detail }: CustomEvent<string>) => {
    const command = [SearchCommand.SELECT_GAME, SearchCommand.HELP].find((command) => detail === command);
    if (command) {
      if (!configure.user?.playing && command === SearchCommand.SELECT_GAME) return;
      setSearchCommand(command);
      this.setState({ search: '' });
    } else {
      this.setState({ search: detail });
    }
    this.setState({ result: this.#genOptions() });
  };

  #getItemHotKey = (index: number) => [isMac ? 'command' : 'ctrl', String(index + 1)];

  #onKeydown = hotkeys({
    ...Object.fromEntries(
      Array.from(Array(9), (_, index) => [
        this.#getItemHotKey(index).join('+'),
        (evt: KeyboardEvent) => {
          this.options.element?.shadowRoot?.querySelectorAll<HTMLElement>('[tabindex]')[index]?.click();
          evt.preventDefault();
        },
      ]),
    ),
    [[getShortcut('OPEN_HELP'), getShortcut('OPEN_SEARCH')].join(',')]: () => this.input.element?.focus(),
  });

  #onKeydownInput = (evt: KeyboardEvent) => {
    hotkeys({
      // Safari bug: https://github.com/mantou132/gem/issues/66
      backspace: () => !this.state.search && setSearchCommand(null),
      [[getShortcut('OPEN_HELP'), getShortcut('OPEN_SEARCH')].join(',')]: (evt) => evt.preventDefault(),
    })(evt);
  };

  #getSearchCommandIcon = (command?: SearchCommand) => {
    if (!command) return;
    return raw`
      <svg viewBox="0 0 24 24">
        <text 
          fill='currentColor'
          x="50%"
          y="50%"
          dominant-baseline="middle"
          text-anchor="middle">${command}</text>
      </svg>
    `;
  };

  #pinyin: typeof import('pinyin').pinyin | undefined = undefined;
  #matchSearch = (str: string) => {
    const { search } = this.state;
    if (!search) return true;

    const pyList = this.#pinyin?.(str, {
      style: 'normal',
      heteronym: true,
      segment: false,
      compact: true,
    }).map((e) => e.join(''));
    for (const py of pyList || []) {
      if (isIncludesString(py, search)) {
        return true;
      }
    }
    return isIncludesString(str, search);
  };

  #genGameOptions = (): Option[] => {
    const favorites = new Set(store.favoriteIds);
    return (
      store.gameIds
        ?.map((id) => {
          const game = store.games[id];
          if (game && this.#matchSearch(game.name)) {
            return {
              icon: icons.game,
              label: html`
                <dy-space>
                  <span>${game.name}</span>
                  ${favorites.has(id) ? html`<dy-use style="width:1em" .element=${icons.favorited}></dy-use>` : ''}
                </dy-space>
              `,
              tagIcon: icons.received,
              onClick: async () => {
                if (mediaQuery.isPhone) {
                  history.push({ path: createPath(routes.game, { params: { [paramKeys.GAME_ID]: String(game.id) } }) });
                } else if (this.#playing) {
                  updateRoom({
                    id: this.#playing.id,
                    private: this.#playing.private,
                    host: this.#playing.host,
                    gameId: game.id,
                  });
                } else {
                  createRoom({ gameId: game.id, private: false });
                }
                toggleSearchState();
              },
            };
          }
        })
        .filter(isNotNullish) || []
    );
  };

  #genHelpOptions = (): Option[] => {
    return this.#helpMessages
      .map((value) => {
        if (!this.#matchSearch(value)) return;
        const [title, desc] = value.split('\n');
        return {
          label: html`
            <dy-alert
              style=${styleMap({
                whiteSpace: 'normal',
                border: 'none',
                padding: '0',
              })}
              .header=${title}
            >
              ${desc}
            </dy-alert>
          `,
        };
      })
      .filter(isNotNullish);
  };

  #genFriendOptions = (): Option[] => {
    return (
      friendStore.friendIds
        ?.map((id) => {
          const friend = friendStore.friends[id];
          if (friend && this.#matchSearch(friend.user.nickname)) {
            return {
              icon: icons.person,
              label: friend.user.nickname,
              tagIcon: this.#playing ? icons.share : undefined,
              onClick: () => {
                if (this.#playing) {
                  createInvite({ targetId: friend.user.id, roomId: this.#playing.id });
                } else {
                  toggleFriendChatState(friend.user.id);
                }
                toggleSearchState();
              },
            };
          }
        })
        .filter(isNotNullish) || []
    );
  };

  #genRoomOptions = (): Option[] => {
    return (
      store.roomIds
        ?.map((id) => {
          const room = store.rooms[id];
          if (!room) return;
          const game = store.games[room.gameId];
          const hostNickname = room.users.find((u) => room.host === u.id)?.nickname || '';
          if (!game) return;
          if (this.#matchSearch(game.name) || this.#matchSearch(hostNickname)) {
            return {
              label: html`
                <dy-list-item
                  .data=${{
                    title: game.name,
                    description: hostNickname,
                    avatar: room.screenshot || getCDNSrc(game.preview),
                  }}
                ></dy-list-item>
              `,
              tagIcon: icons.received,
              onClick: async () => {
                enterPubRoom(room.id);
                toggleSearchState();
              },
            };
          }
        })
        .filter(isNotNullish) || []
    );
  };

  #genOptions = (): Option[] => {
    const { search } = this.state;

    if (configure.searchCommand === SearchCommand.SELECT_GAME) {
      return this.#genGameOptions();
    } else if (configure.searchCommand === SearchCommand.HELP) {
      if (!search) return [];

      return this.#genHelpOptions();
    } else {
      if (!search) return [];

      const options: Option[] = [];
      const playing = configure.user?.playing;
      const isHost = playing?.host === configure.user?.id;

      if (this.#isRooms) {
        options.push(...this.#genRoomOptions());
      } else if (!playing || isHost) {
        options.push(...this.#genGameOptions());
      }

      if (!mediaQuery.isPhone) {
        options.push(...this.#genFriendOptions());
      }

      return options.sort((a, b) => (a.label > b.label ? 1 : -1));
    }
  };

  mounted = () => {
    import('src/i18n/help').then(({ helpI18n }) => {
      const resources = helpI18n.resources[helpI18n.currentLanguage] || {};
      this.#helpMessages = Object.values(resources);
    });

    if (i18n.currentLanguage.startsWith('zh-')) {
      import('pinyin').then(({ default: pinyin }) => {
        this.#pinyin = pinyin;
        this.setState({ result: this.#genOptions() });
      });
    }

    this.addEventListener('keydown', this.#onKeydown);
  };

  render = () => {
    const { search, result } = this.state;

    if (configure.searchCommand !== SearchCommand.HELP && !mediaQuery.isPhone) {
      result.forEach((option, index) => {
        if (index < 9) {
          option.tag = html`
            <dy-paragraph>
              <kbd>
                ${this.#getItemHotKey(index)
                  .map((key) => getDisplayKey(key))
                  .join(' ')}
              </kbd>
            </dy-paragraph>
          `;
        }
      });
    }

    return html`
      <div class="header">
        <dy-input
          ref=${this.input.ref}
          class="input"
          autofocus
          .value=${search}
          .icon=${this.#getSearchCommandIcon(configure.searchCommand)}
          @change=${this.#onChange}
          @keydown=${this.#onKeydownInput}
          placeholder=${getTempText(
            i18n.get(
              configure.searchCommand === SearchCommand.HELP
                ? 'help'
                : configure.searchCommand === SearchCommand.SELECT_GAME
                ? 'selectGame'
                : this.#isRooms
                ? 'placeholder.roomSearch'
                : configure.user?.playing
                ? 'placeholder.searchPlaying'
                : 'placeholder.search',
              configure.searchCommand === SearchCommand.HELP
                ? getShortcut('OPEN_SEARCH', true)
                : configure.searchCommand === SearchCommand.SELECT_GAME
                ? ''
                : getShortcut('OPEN_SEARCH', true),
            ),
          )}
        ></dy-input>
      </div>
      <div class="result">
        ${search || configure.searchCommand === SearchCommand.SELECT_GAME
          ? html`
              <dy-options
                class="options"
                ref=${this.options.ref}
                .options=${result.length ? result : [{ label: locale.noData }]}
              ></dy-options>
            `
          : ''}
        <div class="placeholder" @click=${toggleSearchState}></div>
      </div>
    `;
  };
}
