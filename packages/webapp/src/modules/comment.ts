import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  property,
  connectStore,
} from '@mantou/gem';
import { Time } from 'duoyun-ui/lib/time';

import { Comment } from 'src/store';
import { theme } from 'src/theme';
import { configure } from 'src/configure';
import { i18n } from 'src/i18n/basic';

import 'duoyun-ui/elements/help-text';

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    width: 100%;
    box-sizing: border-box;
    padding: 1em;
    border-radius: ${theme.normalRound};
    background-color: ${theme.hoverBackgroundColor};
  }
  .header {
    display: flex;
    align-content: center;
    gap: 2px;
  }
  .icon {
    width: 1em;
  }
  .body {
    white-space: pre-wrap;
  }
  .none {
    white-space: normal;
    font-style: italic;
  }
`);

/**
 * @customElement m-comment
 */
@customElement('m-comment')
@adoptedStyle(style)
@connectStore(i18n.store)
export class MCommentElement extends GemElement {
  @property comment: Comment;

  get #isSelf() {
    return this.comment.user.id === configure?.user?.id;
  }

  render = () => {
    return html`
      <style>
        :host {
          order: ${this.#isSelf ? 0 : 1};
          background-image: ${!this.comment.like
            ? `linear-gradient(to left bottom, ${theme.negativeColor} -300%, transparent)`
            : 'none'};
        }
      </style>
      <dy-help-text class="header">
        [${new Time().relativeTimeFormat(this.comment.updatedAt)}]
        ${i18n.get(
          this.comment.like ? 'likeGameComment' : 'unLikeGameComment',
          this.#isSelf ? i18n.get('selfComment') : this.comment.user.nickname,
        )}
        <span style="flex-grow: 1"></span>
      </dy-help-text>
      ${this.comment.body
        ? html`<div class="body">${this.comment.body}</div>`
        : html`<dy-help-text class="none">${i18n.get('noneComment')}</dy-help-text>`}
    `;
  };
}
