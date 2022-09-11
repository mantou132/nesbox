import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  history,
  styleMap,
  raw,
} from '@mantou/gem';
import { locale } from 'duoyun-ui/lib/locale';
import { isIncludesString } from 'duoyun-ui/lib/utils';
import type { Option } from 'duoyun-ui/elements/options';
import { createPath, matchPath } from 'duoyun-ui/elements/route';
import { isNotNullish } from 'duoyun-ui/lib/types';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';

import { friendStore, store, toggoleFriendChatState } from 'src/store';
import { theme } from 'src/theme';
import { i18n } from 'src/i18n';
import { icons } from 'src/icons';
import { configure, getShortcut, SearchCommand, setSearchCommand, toggoleSearchState } from 'src/configure';
import { routes } from 'src/routes';
import { paramKeys } from 'src/constants';
import { getCDNSrc, getTempText } from 'src/utils';
import { createInvite, enterPubRoom, updateRoom } from 'src/services/api';

import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/options';
import 'duoyun-ui/elements/alert';
import 'duoyun-ui/elements/list';

const style = createCSSSheet(css`
  :host {
    border-radius: ${theme.normalRound};
    overflow: hidden;
    display: flex;
    flex-direction: column;
    width: min(100vw, 30em);
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
    overflow: auto;
    margin-block-start: -0.6em;
    border: none;
  }
`);

type State = {
  search: string;
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
  state: State = {
    search: '',
  };

  get #isRooms() {
    return matchPath(routes.rooms.pattern, history.getParams().path);
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

  #renderResultIcon = (icon: string) => {
    return html`<dy-use .element=${icon} style="width: 1.5em; flex-shrink: 0;"></dy-use>`;
  };

  #genGameOptions = (): Option[] => {
    return (
      store.gameIds
        ?.map((id) => {
          const game = store.games[id];
          if (game && isIncludesString(game.name, this.state.search)) {
            return {
              icon: icons.game,
              label: game.name,
              tag: this.#playing ? this.#renderResultIcon(icons.received) : undefined,
              onClick: async () => {
                if (this.#playing) {
                  updateRoom({
                    id: this.#playing.id,
                    private: this.#playing.private,
                    host: this.#playing.host,
                    gameId: game.id,
                  });
                } else {
                  history.push({
                    path: createPath(routes.game, {
                      params: {
                        [paramKeys.GAME_ID]: game.id.toString(),
                      },
                    }),
                  });
                }
                toggoleSearchState();
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
        if (!isIncludesString(value, this.state.search)) return;
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
          if (friend && isIncludesString(friend.user.nickname, this.state.search)) {
            return {
              icon: icons.person,
              label: friend.user.nickname,
              tag: this.#playing ? this.#renderResultIcon(icons.share) : undefined,
              onClick: () => {
                if (this.#playing) {
                  createInvite({ targetId: friend.user.id, roomId: this.#playing.id });
                } else {
                  toggoleFriendChatState(friend.user.id);
                }
                toggoleSearchState();
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
          if (isIncludesString(game.name, this.state.search) || isIncludesString(hostNickname, this.state.search)) {
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
              tag: this.#renderResultIcon(icons.received),
              onClick: async () => {
                enterPubRoom(room.id);
                toggoleSearchState();
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

      options.push(...this.#genFriendOptions());

      return options.sort((a, b) => (a.label > b.label ? 1 : -1));
    }
  };

  mounted = () => {
    import('src/help-i18n').then(({ helpI18n }) => {
      const resources = helpI18n.resources[helpI18n.currentLanguage] || {};
      this.#helpMessages = Object.entries(resources).map(([, v]) => (v.message || v) as string);
    });
  };

  render = () => {
    const { search } = this.state;
    const options = this.#genOptions();

    return html`
      <div class="header">
        <dy-input
          class="input"
          autofocus
          .value=${search}
          .icon=${this.#getSearchCommandIcon(configure.searchCommand)}
          @change=${this.#onChange}
          @keydown=${hotkeys({
            [[getShortcut('OPEN_HELP'), getShortcut('OPEN_SEARCH')].join(',')]: (evt) => evt.preventDefault(),
            backspace: () => !search && setSearchCommand(null),
          })}
          placeholder=${getTempText(
            i18n.get(
              configure.searchCommand === SearchCommand.HELP
                ? 'help'
                : configure.searchCommand === SearchCommand.SELECT_GAME
                ? 'selectGame'
                : this.#isRooms
                ? 'placeholderRoomSearch'
                : configure.user?.playing
                ? 'placeholderSearchPlaying'
                : 'placeholderSearch',
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
        <dy-options class="options" .options=${options.length ? options : [{ label: locale.noData }]}></dy-options>
        <div class="placeholder" @click=${toggoleSearchState}></div>
      </div>
    `;
  };
}
