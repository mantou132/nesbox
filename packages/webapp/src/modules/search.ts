import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore, history } from '@mantou/gem';
import { locale } from 'duoyun-ui/lib/locale';
import { isIncludesString } from 'duoyun-ui/lib/utils';
import type { Option } from 'duoyun-ui/elements/options';
import { createPath } from 'duoyun-ui/elements/route';

import { friendStore, store } from 'src/store';
import { theme } from 'src/theme';
import { i18n } from 'src/i18n';
import { icons } from 'src/icons';
import { configure, getShortcut, toggoleFriendChatState, toggoleSearchState } from 'src/configure';
import { routes } from 'src/routes';
import { paramKeys } from 'src/constants';
import { getTempText } from 'src/utils';
import { updateRoom } from 'src/services/api';

import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/options';

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column;
    background-color: ${theme.backgroundColor};
    width: min(100vw, 30em);
    margin-top: -38vh;
    font-size: 1.125em;
  }
  .header {
    padding: 0.6em;
  }
  .input {
    width: 100%;
  }
  .options {
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

  render = () => {
    const options: Option[] = [];
    const playing = configure.user?.playing;
    const isHost = playing?.host === configure.user?.id;

    (!playing || isHost) &&
      store.gameIds?.forEach((id) => {
        const game = store.games[id];
        if (game && isIncludesString(game.name, this.state.search)) {
          options.push({
            icon: icons.game,
            label: game.name,
            tag: playing ? html`<dy-use .element=${icons.received}></dy-use>` : undefined,
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

    friendStore.friendIds?.forEach((id) => {
      const friend = friendStore.friends[id];
      if (friend && isIncludesString(friend.user.nickname, this.state.search)) {
        options.push({
          icon: icons.person,
          label: friend.user.nickname,
          onClick: () => {
            toggoleFriendChatState(friend.user.id);
            toggoleSearchState();
          },
        });
      }
    });

    return html`
      <div class="header">
        <dy-input
          class="input"
          autofocus
          clearable
          @clear=${() => this.setState({ search: '' })}
          .value=${this.state.search}
          @change=${({ detail }: CustomEvent<string>) => this.setState({ search: detail })}
          placeholder=${getTempText(i18n.get('placeholderSearch', getShortcut('OPEN_SEARCH', true)))}
        ></dy-input>
      </div>
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
    `;
  };
}
