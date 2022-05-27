import {
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  numattribute,
  styleMap,
} from '@mantou/gem';
import { Modal } from 'duoyun-ui/elements/modal';

import { createComment, createRoom, getComments } from 'src/services/api';
import { store } from 'src/store';
import { icons } from 'src/icons';
import { configure } from 'src/configure';
import { PBaseElement } from 'src/pages/base';
import { theme } from 'src/theme';
import { i18n } from 'src/i18n';

import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/input';
import 'duoyun-ui/elements/heading';
import 'src/modules/nav';
import 'src/modules/screenshots';
import 'src/modules/comment';
import 'src/modules/footer';

const style = createCSSSheet(css`
  main {
    padding-inline: ${theme.gridGutter};
    flex-direction: row;
    align-items: flex-start;
  }
  .info {
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
    position: sticky;
    top: 4em;
  }
  .header {
    width: 100%;
    display: flex;
    align-items: center;
    margin-block: 1em;
  }
  .title {
    flex-grow: 1;
    margin: 0;
  }
  .preview {
    width: 100%;
    aspect-ratio: 503/348;
  }
  .buttons {
    display: flex;
    width: 13em;
  }
  .buttons * {
    width: 0;
    flex-grow: 1;
    margin-inline-end: -1px;
  }
`);

/**
 * @customElement p-game
 */
@customElement('p-game')
@adoptedStyle(style)
@connectStore(i18n.store)
@connectStore(store)
export class PGameElement extends PBaseElement {
  @numattribute gameId: number;

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
          type="textarea"
          style=${styleMap({ width: '30em' })}
          .value=${this.#comment?.body || ''}
          @change=${({ target, detail }: CustomEvent<string>) => ((target as HTMLInputElement).value = detail)}
        ></dy-input>
      `,
    });
    createComment({ gameId: this.gameId, like, body: input.value });
  };

  mounted = () => {
    getComments(this.gameId);
  };

  render = () => {
    const game = store.games[this.gameId];

    let likedCount = 0;

    const commentList =
      this.#commentIds?.length === 0
        ? html`
            <dy-result
              style="height: 60vh; width: 100%;"
              .illustrator=${icons.empty}
              .header=${i18n.get('notDataTitle')}
            ></dy-result>
          `
        : html`
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
      <m-nav></m-nav>
      <main>
        <div class="info">
          <m-screenshots .links=${game?.screenshots}></m-screenshots>
          <div class="header">
            <dy-heading lv=1 class="title">${game?.name}</dy-heading>
            <dy-button  @click=${() => game && createRoom({ gameId: game.id, private: false })}>开始游戏</dy-button>
          </div>
          <div>${game?.description}</div>
          <dy-heading lv=2>用户评论</dy-heading>
          ${commentList}
        </div>
        <div class="aside">
          <img class="preview" src='https://user-images.githubusercontent.com/3841872/168952574-26de855e-b7cd-43fe-ab94-093a2903832d.png'></img>
          <div class="buttons">
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
          </div>
        </div>
      </main>
      <m-footer></m-footer>
    `;
  };
}