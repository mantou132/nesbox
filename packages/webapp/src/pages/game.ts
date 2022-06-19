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

import { createComment, createRoom, getComments } from 'src/services/api';
import { store } from 'src/store';
import { icons } from 'src/icons';
import { configure } from 'src/configure';
import { theme } from 'src/theme';
import { i18n } from 'src/i18n';
import { getGithubGames, open } from 'src/utils';
import { githubIssue } from 'src/constants';

import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/heading';
import 'src/modules/screenshots';
import 'src/modules/comment';
import 'src/modules/game-detail';

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: row;
    gap: 1.5em;
    min-height: 100vh;
    padding-inline: ${theme.gridGutter};
    align-items: flex-start;
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
    width: 25em;
    flex-shrink: 0;
  }
  .header {
    width: 100%;
    display: flex;
    align-items: center;
  }
  @media ${mediaQuery.PHONE} {
    main {
      flex-direction: column;
    }
    .aside {
      display: none;
    }
    .header {
      flex-direction: column;
      gap: 1em;
      align-items: flex-start;
    }
  }
  .title {
    flex-grow: 1;
    margin: 0;
  }
  .icon {
    width: 1.5rem;
    padding: 0.3rem;
  }
  .icon:hover {
    background-color: ${theme.hoverBackgroundColor};
  }
  .preview {
    width: 100%;
    aspect-ratio: 503/348;
    object-fit: cover;
    border-radius: ${theme.normalRound};
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
    width: 4em;
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
      header: '编写评论',
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
      <div class="info">
        <m-screenshots .links=${game?.screenshots}></m-screenshots>
        <div class="header">
          <dy-heading lv="1" class="title">
            ${game?.name}
            <dy-use class="icon" @click=${this.#edit} .element=${icons.edit}></dy-use>
          </dy-heading>
          <dy-button @click=${() => game && createRoom({ gameId: game.id, private: false })}>
            ${i18n.get('startGame')}
          </dy-button>
        </div>
        <m-game-detail .md=${game?.description || ''}></m-game-detail>
      </div>
      <div class="aside">
        <img class="preview" src=${game?.preview || ''} />
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
    `;
  };
}
