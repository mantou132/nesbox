import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  property,
  styleMap,
  connectStore,
} from '@mantou/gem';
import { Modal } from 'duoyun-ui/elements/modal';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';

import { Game, store } from 'src/store';
import { theme } from 'src/theme';
import { configure } from 'src/configure';
import { i18n } from 'src/i18n/basic';
import { createComment } from 'src/services/api';
import { icons } from 'src/icons';

import 'duoyun-ui/elements/help-text';
import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/heading';
import 'duoyun-ui/elements/input';
import 'src/modules/comment';

const style = createCSSSheet(css`
  :host {
    display: contents;
  }
  .list {
    column-count: 3;
    gap: ${theme.gridGutter};
  }
  .comment {
    margin-bottom: ${theme.gridGutter};
    break-inside: avoid;
  }
  .comment-title {
    gap: 2em;
    display: flex;
    align-items: center;
  }
  .comment-title > * {
    margin: 0;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .comment-title dy-input-group {
    width: 13em;
    flex-shrink: 0;
  }
  .comment-title dy-button {
    width: 5.5em;
  }
  @media ${mediaQuery.PHONE} {
    .comment-title dy-heading {
      flex-grow: 1;
    }
    .list {
      column-count: 1;
      gap: 1em;
    }
  }
`);

/**
 * @customElement m-comment-list
 */
@customElement('m-comment-list')
@connectStore(store)
@adoptedStyle(style)
export class MCommentListElement extends GemElement {
  @property game?: Game;

  get #gameId() {
    return this.game?.id || 0;
  }

  get #comments() {
    return store.comment[this.#gameId]?.comments;
  }

  get #commentIds() {
    return store.comment[this.#gameId]?.userIds;
  }

  get #selfId() {
    return configure.user?.id || 0;
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

  #getPercentage() {
    if (!this.#commentIds?.length) return ['0%', '0%'];
    const total = this.#commentIds.length || Infinity;
    const liked = this.#commentIds.filter((id) => !!this.#comments?.[id]?.like).length / total;
    return [liked, 1 - liked].map((e) => `${Math.round(e * 100)}%`);
  }

  #changeComment = async (like: boolean) => {
    const input = await Modal.open<HTMLInputElement>({
      header: i18n.get('page.game.addComment'),
      body: html`
        <dy-input
          autofocus
          type="textarea"
          style=${styleMap({ width: 'min(30em, 100%)' })}
          .value=${this.#comment?.body || ''}
          @change=${({ target, detail }: CustomEvent<string>) => ((target as HTMLInputElement).value = detail)}
        ></dy-input>
      `,
    });
    createComment({ gameId: this.#gameId, like, body: input.value });
  };

  render = () => {
    const [liked, unLiked] = this.#getPercentage();

    return html`
      <div class="comment-title">
        <dy-heading lv="3">${i18n.get('page.game.commentTitle')}</dy-heading>
        <dy-input-group>
          <dy-button
            color=${theme.textColor}
            @click=${() => this.#changeComment(true)}
            .icon=${this.#isSelfLike ? icons.likeSolid : icons.like}
            type=${this.#isSelfLike ? 'solid' : 'reverse'}
          >
            ${liked}
          </dy-button>
          <dy-button
            color=${theme.textColor}
            @click=${() => this.#changeComment(false)}
            .icon=${this.#isSelfUnLike ? icons.unlikeSolid : icons.unlike}
            type=${this.#isSelfUnLike ? 'solid' : 'reverse'}
          >
            ${unLiked}
          </dy-button>
        </dy-input-group>
      </div>
      <div class="list">
        ${this.#comments?.[this.#selfId]
          ? html`<m-comment class="comment" .comment=${this.#comments[this.#selfId]!}></m-comment>`
          : ''}
        ${this.#commentIds
          ?.filter((id) => id !== this.#selfId)
          ?.map((id) =>
            this.#comments?.[id] ? html`<m-comment class="comment" .comment=${this.#comments[id]!}></m-comment>` : '',
          )}
      </div>
    `;
  };
}
