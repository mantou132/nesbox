import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, property } from '@mantou/gem';
import { Time } from 'duoyun-ui/lib/time';

import { Comment } from 'src/store';
import { theme } from 'src/theme';
import { configure } from 'src/configure';
import { i18n } from 'src/i18n';

import 'duoyun-ui/elements/help-text';

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    width: 100%;
    box-sizing: border-box;
    padding: 1em;
  }
  .body {
    white-space: pre;
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
          background-color: ${this.#isSelf ? theme.hoverBackgroundColor : theme.lightBackgroundColor};
          border: 1px solid ${this.comment.like ? theme.positiveColor : theme.negativeColor};
        }
      </style>
      <dy-help-text>
        [${new Time().relativeTimeFormat(this.comment.updatedAt)}] ${this.#isSelf ? '我' : this.comment.user.nickname}:
      </dy-help-text>
      ${this.comment.body
        ? html`<div class="body">${this.comment.body}</div>`
        : html`<dy-help-text class="none">${i18n.get('noneComment')}</dy-help-text>`}
    `;
  };
}
