import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, property } from '@mantou/gem';
import { Time } from 'duoyun-ui/lib/time';

import { configure } from 'src/configure';
import { Message } from 'src/store';
import { theme } from 'src/theme';

import 'duoyun-ui/elements/help-text';

const style = createCSSSheet(css`
  :host {
    display: block;
  }
  .body {
    display: flex;
  }
  .msg {
    padding: 0 0.3em;
    line-height: 1.5;
    max-width: 80%;
  }
  .time {
    font-size: 0.875em;
  }
`);

/**
 * @customElement m-msg
 */
@customElement('m-msg')
@adoptedStyle(style)
export class MMsgElement extends GemElement {
  @property msg?: Message;

  get #isSelf() {
    return this.msg?.userId === configure.user?.id;
  }

  render = () => {
    if (!this.msg) return html``;
    return html`
      <style>
        .body {
          justify-content: ${this.#isSelf ? 'flex-end' : 'flex-start'};
        }
        .msg {
          background-color: ${this.#isSelf ? theme.describeColor : theme.noticeColor};
        }
      </style>
      <div class="body">
        <dy-help-text class="time">${new Time(this.msg.createdAt).format('HH:mm:ss')}</dy-help-text>
      </div>
      <div class="body">
        <div class="msg">${this.msg.body}</div>
      </div>
    `;
  };
}
