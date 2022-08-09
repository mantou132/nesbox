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
} from '@mantou/gem';
import { locale } from 'duoyun-ui/lib/locale';
import { isIncludesString } from 'duoyun-ui/lib/utils';
import type { Option } from 'duoyun-ui/elements/options';
import { createPath } from 'duoyun-ui/elements/route';
import { isNotNullish } from 'duoyun-ui/lib/types';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';

import { friendStore, store, toggoleFriendChatState } from 'src/store';
import { theme } from 'src/theme';
import { i18n } from 'src/i18n';
import { icons } from 'src/icons';
import { configure, getShortcut, searchCommands, setSearchCommand, toggoleSearchState } from 'src/configure';
import { routes } from 'src/routes';
import { paramKeys } from 'src/constants';
import { getTempText } from 'src/utils';
import { createInvite, updateRoom } from 'src/services/api';

import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/options';
import 'duoyun-ui/elements/alert';

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
    min-height: 0;
    flex-grow: 1;
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
export class MSearchElement extends GemElement<State> {
  state: State = {
    search: '',
  };

  #helpMessages: string[] = [];

  #getSearchCommand = (detail: string) => {
    return searchCommands.find((command) => detail && detail.startsWith(command));
  };

  #onChange = ({ detail }: CustomEvent<string>) => {
    const command = this.#getSearchCommand(detail);
    if (command !== configure.searchCommand) {
      setSearchCommand(command);
    }
    this.setState({ search: command ? detail.substring(1) : detail });
  };

  #renderIcon = (icon: string) => {
    return html`<dy-use .element=${icon} style="width: 1.5em; flex-shrink: 0;"></dy-use>`;
  };

  #genOptions = (): Option[] => {
    if (configure.searchCommand === '?') {
      const search = this.state.search.substring(1);
      if (!search) return [];

      return this.#helpMessages
        .map((value) => {
          if (!isIncludesString(value, search)) return;
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
    } else {
      const options: Option[] = [];
      const playing = configure.user?.playing;
      const isHost = playing?.host === configure.user?.id;

      if (!playing || isHost) {
        store.gameIds?.forEach((id) => {
          const game = store.games[id];
          if (game && isIncludesString(game.name, this.state.search)) {
            options.push({
              icon: icons.game,
              label: game.name,
              tag: playing ? this.#renderIcon(icons.received) : undefined,
              onClick: async () => {
                if (playing) {
                  updateRoom({
                    id: playing.id,
                    private: playing.private,
                    host: playing.host,
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
            });
          }
        });
      }

      friendStore.friendIds?.forEach((id) => {
        const friend = friendStore.friends[id];
        if (friend && isIncludesString(friend.user.nickname, this.state.search)) {
          options.push({
            icon: icons.person,
            label: friend.user.nickname,
            tag: playing ? this.#renderIcon(icons.share) : undefined,
            onClick: () => {
              if (playing) {
                createInvite({ targetId: friend.user.id, roomId: playing.id });
              } else {
                toggoleFriendChatState(friend.user.id);
              }
              toggoleSearchState();
            },
          });
        }
      });

      return options;
    }
  };

  mounted = () => {
    import('src/help-i18n').then(({ helpI18n }) => {
      const resources = helpI18n.resources[helpI18n.currentLanguage] || {};
      this.#helpMessages = Object.entries(resources).map(([, v]) => (v.message || v) as string);
    });
  };

  render = () => {
    const options = this.#genOptions();

    return html`
      <div class="header">
        <dy-input
          class="input"
          autofocus
          .value=${`${configure.searchCommand || ''}${this.state.search}`}
          @change=${this.#onChange}
          @keydown=${hotkeys({
            [[getShortcut('OPEN_HELP'), getShortcut('OPEN_SEARCH')].join(',')]: (evt) => evt.preventDefault(),
          })}
          placeholder=${getTempText(
            i18n.get(
              configure.user?.playing ? 'placeholderSearchPlaying' : 'placeholderSearch',
              getShortcut('OPEN_SEARCH', true),
            ),
          )}
        ></dy-input>
      </div>
      <div class="result">
        ${this.state.search
          ? html`
              <dy-options
                class="options"
                .options=${options.length
                  ? options.sort((a, b) => (a.label > b.label ? 1 : -1))
                  : [{ label: locale.noData }]}
              ></dy-options>
            `
          : ''}
      </div>
    `;
  };
}
