import {
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  numattribute,
  styleMap,
  GemElement,
} from '@mantou/gem';
import { Modal } from 'duoyun-ui/elements/modal';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { waitLoading } from 'duoyun-ui/elements/wait';
import { formatDuration, Time } from 'duoyun-ui/lib/time';

import { createComment, createRoom, getComments } from 'src/services/api';
import { store } from 'src/store';
import { icons } from 'src/icons';
import { configure } from 'src/configure';
import { theme } from 'src/theme';
import { i18n } from 'src/i18n';
import { getCDNSrc, getGithubGames } from 'src/utils';
import { githubIssue } from 'src/constants';

import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/heading';
import 'duoyun-ui/elements/divider';
import 'src/modules/screenshots';
import 'src/modules/comment';
import 'src/modules/game-detail';

const style = createCSSSheet(css`
  :host {
    display: block;
    min-height: 100vh;
    padding-inline: ${theme.gridGutter};
    align-items: flex-start;
  }
  dy-divider {
    margin-block-end: ${theme.gridGutter};
  }
  .content {
    display: flex;
    flex-direction: row;
    gap: 1.5em;
  }
  .screenshots,
  .preview {
    box-shadow: 0 0 0 0.5px ${theme.borderColor};
  }
  .preview {
    filter: ${theme.imageFilter};
  }
  .info {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: ${theme.gridGutter};
  }
  .aside {
    display: flex;
    flex-direction: column;
    gap: ${theme.gridGutter};
    width: 22em;
    flex-shrink: 0;
  }
  .header {
    width: 100%;
    display: flex;
    align-items: center;
  }
  .title {
    flex-grow: 1;
    margin: 0;
  }
  .icon {
    width: 1.5rem;
    padding: 0.3rem;
    border-radius: ${theme.normalRound};
  }
  .icon:hover {
    background-color: ${theme.hoverBackgroundColor};
  }
  .preview {
    display: block;
    width: 100%;
    aspect-ratio: 503/348;
    object-fit: cover;
    border-radius: ${theme.normalRound};
  }
  .stats {
    position: absolute;
    width: 100%;
    box-sizing: border-box;
    bottom: 0;
    display: flex;
    justify-content: space-between;
    padding: 0.5em;
    background: rgba(0, 0, 0, 0.6);
  }
  .stats-icon {
    gap: 0.2em;
  }
  .stats-icon::part(icon) {
    width: 1.2em;
  }
  .comment-title {
    display: flex;
    align-items: center;
  }
  .comment-title > * {
    margin: 0;
    flex-grow: 1;
  }
  .comment-title dy-button {
    width: 5.5em;
  }
  @media ${mediaQuery.PHONE} {
    .content {
      flex-direction: column;
    }
    .aside {
      width: 100%;
    }
    .preview {
      display: none;
    }
    .header {
      flex-direction: column;
      gap: 1em;
      align-items: flex-start;
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

  get #comments() {
    return store.comment[this.gameId]?.comments;
  }

  get #commentIds() {
    return store.comment[this.gameId]?.userIds;
  }

  get #comment() {
    return this.#comments?.[configure.user?.id || 0];
  }

  get #isSelfLike() {
    return this.#comment && this.#comment.like;
  }

  get #isSelfUnLike() {
    return this.#comment && !this.#comment.like;
  }

  #changeComment = async (like: boolean) => {
    const input = await Modal.open<HTMLInputElement>({
      header: i18n.get('addComment'),
      body: html`
        <dy-input
          autofocus
          type="textarea"
          style=${styleMap({ width: '30em' })}
          .value=${this.#comment?.body || ''}
          @change=${({ target, detail }: CustomEvent<string>) => ((target as HTMLInputElement).value = detail)}
        ></dy-input>
      `,
    });
    createComment({ gameId: this.gameId, like, body: input.value });
  };

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
  };

  render = () => {
    const game = this.#game;
    const record = store.record[this.gameId];

    let likedCount = 0;

    const commentList = html`
      ${this.#commentIds?.map((id) => {
        if (this.#comments?.[id]?.like) likedCount++;
        return this.#comments?.[id] && html`<m-comment .comment=${this.#comments[id]!}></m-comment>`;
      })}
    `;

    const formatPercentage = (like: boolean) =>
      !!this.#commentIds?.length
        ? `${Math.round(((like ? likedCount : this.#commentIds.length - likedCount) * 100) / this.#commentIds.length)}%`
        : '0%';

    return html`
      <dy-divider></dy-divider>
      <div class="content">
        <div class="info">
          <m-screenshots class="screenshots" .links=${game?.screenshots}></m-screenshots>
          <div class="header">
            <dy-heading lv="1" class="title">
              ${game?.name}
              <dy-use class="icon" @click=${this.#edit} .element=${icons.edit}></dy-use>
            </dy-heading>
            <dy-button data-cy="start" @click=${() => game && createRoom({ gameId: game.id, private: false })}>
              ${i18n.get('startGame')}
            </dy-button>
          </div>
          <m-game-detail .md=${game?.description || ''}></m-game-detail>
        </div>
        <div class="aside">
          <div style="position: relative;">
            <img class="preview" draggable="false" src=${game ? getCDNSrc(game.preview) : ''} />
            ${record
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
          <div class="comment-title">
            <dy-heading lv="3">${i18n.get('gameComment')}</dy-heading>
            <dy-input-group>
              <dy-button
                color=${theme.textColor}
                @click=${() => this.#changeComment(true)}
                .icon=${this.#isSelfLike ? icons.likeSolid : icons.like}
                type=${this.#isSelfLike ? 'solid' : 'reverse'}
              >
                ${formatPercentage(true)}
              </dy-button>
              <dy-button
                color=${theme.textColor}
                @click=${() => this.#changeComment(false)}
                .icon=${this.#isSelfUnLike ? icons.unlikeSolid : icons.unlike}
                type=${this.#isSelfUnLike ? 'solid' : 'reverse'}
              >
                ${formatPercentage(false)}
              </dy-button>
            </dy-input-group>
          </div>
          ${commentList}
        </div>
      </div>
    `;
  };
}
