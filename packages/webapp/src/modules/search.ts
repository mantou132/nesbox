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
import { createInvite, updateRoom } from 'src/services/api';

import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/options';

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
            tag: playing ? html`<dy-use .element=${icons.received} style="width: 1.5em"></dy-use>` : undefined,
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
          tag: playing ? html`<dy-use .element=${icons.share} style="width: 1.5em"></dy-use>` : undefined,
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

    return html`
      <div class="header">
        <dy-input
          class="input"
          autofocus
          .value=${this.state.search}
          @change=${({ detail }: CustomEvent<string>) => this.setState({ search: detail })}
          placeholder=${getTempText(
            i18n.get(playing ? 'placeholderSearchPlaying' : 'placeholderSearch', getShortcut('OPEN_SEARCH', true)),
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
