import {
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  numattribute,
  GemElement,
} from '@mantou/gem';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { formatDuration, Time } from 'duoyun-ui/lib/time';
import { waitLoading } from 'duoyun-ui/elements/wait';

import { getComments } from 'src/services/guest-api';
import { getRecord } from 'src/services/api';
import { store } from 'src/store';
import { icons } from 'src/icons';
import { theme } from 'src/theme';
import { i18n } from 'src/i18n/basic';
import { getGithubGames } from 'src/utils/common';
import { githubIssue } from 'src/constants';
import { configure } from 'src/configure';

import 'duoyun-ui/elements/action-text';
import 'duoyun-ui/elements/divider';
import 'src/modules/screenshots';
import 'src/modules/comment-list';
import 'src/modules/game-detail';

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    padding-inline: ${theme.gridGutter};
    padding-block-start: ${theme.gridGutter};
    gap: ${theme.gridGutter};
  }
  .content {
    display: flex;
    flex-direction: row;
    gap: calc(3 * ${theme.gridGutter});
    margin-block: calc(${theme.gridGutter});
  }
  .aside {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex-shrink: 0;
    width: 12em;
    line-height: 2;
  }
  .stats-icon {
    gap: 0.2em;
  }
  .stats-icon::part(icon) {
    width: 1.2em;
  }
  @media ${mediaQuery.PHONE} {
    .content {
      flex-direction: column;
    }
  }
`);

/**
 * @customElement p-game
 */
@customElement('p-game')
@adoptedStyle(style)
@connectStore(i18n.store)
@connectStore(store)
export class PGameElement extends GemElement {
  @numattribute gameId: number;

  get #game() {
    return store.games[this.gameId];
  }

  #edit = async () => {
    if (this.#game) {
      const { name } = this.#game;
      const links = await waitLoading(getGithubGames(name));
      const link = links.find((e) => e.textContent === name);
      if (link) {
        open(new URL(githubIssue).origin + new URL(link.href).pathname);
      } else {
        open(githubIssue);
      }
    }
  };

  mounted = () => {
    getComments(this.gameId);
    if (configure.user) {
      getRecord(this.gameId);
    }
  };

  render = () => {
    const record = store.record[this.gameId];

    return html`
      <m-screenshots class="screenshots" .game=${this.#game}></m-screenshots>
      <div class="content">
        <m-game-detail .game=${this.#game}></m-game-detail>
        <div class="aside">
          ${record
            ? html`
                <dy-use class="stats-icon" .element=${icons.date}>
                  ${i18n.get('page.game.lastPlay', new Time().relativeTimeFormat(record.lastPlayStartAt))}
                </dy-use>
                <dy-use class="stats-icon" .element=${icons.schedule}>
                  ${i18n.get('page.game.totalPlay', formatDuration(record.playTotal))}
                </dy-use>
              `
            : ''}
          <dy-use class="stats-icon" @click=${this.#edit} .element=${icons.edit}>
            <dy-action-text>${i18n.get('page.game.update')}</dy-action-text>
          </dy-use>
        </div>
      </div>
      <dy-divider></dy-divider>
      <m-comment-list .game=${this.#game}></m-comment-list>
    `;
  };
}
