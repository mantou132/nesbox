import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  property,
  state,
  boolattribute,
} from '@mantou/gem';

import { formatTime } from 'src/utils/common';
import { configure } from 'src/configure';
import { Message } from 'src/store';
import { theme } from 'src/theme';

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  :host(:where(:--self, [data-self])) {
    align-items: flex-end;
  }
  .body {
    position: relative;
    padding: 0.2em 0.5em;
    line-height: 1.3;
    max-width: 80%;
    background-color: ${theme.noticeColor};
    border-radius: ${theme.smallRound};
  }
  :host(:where(:--self, [data-self])) .body {
    background-color: ${theme.describeColor};
  }
  :host([last]) {
    margin-block-end: 0.5em;
  }
  :host([last]) .body::after {
    position: absolute;
    content: '';
    top: 100%;
    border: 0.35em solid transparent;
    transform: translateY(-50%);
    border-inline-start-color: ${theme.noticeColor};
    left: 0;
    border-inline-color: ${theme.noticeColor} transparent;
  }
  :host(:is(:--self, [data-self])) .body::after {
    left: auto;
    right: 0;
    border-inline-color: transparent ${theme.describeColor};
  }
  .time {
    opacity: 0.6;
    font-size: 0.75em;
    width: 100%;
    text-align: center;
    margin-block: 1em;
  }
`);

/**
 * @customElement m-msg
 */
@customElement('m-msg')
@adoptedStyle(style)
export class MMsgElement extends GemElement {
  @property msg?: Message;

  @boolattribute time: boolean;
  @boolattribute last: boolean;

  @state self: boolean;

  render = () => {
    if (!this.msg) return html``;

    this.self = this.msg?.userId === configure.user?.id;

    return html`
      ${this.time ? html`<div class="time">${formatTime(this.msg.createdAt)}</div>` : ''}
      <div class="body">
        <div>${this.msg.body}</div>
      </div>
    `;
  };
}
