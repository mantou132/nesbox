import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, property } from '@mantou/gem';

import { formatTime } from 'src/utils/common';
import { LobbyMessage } from 'src/store';
import { theme } from 'src/theme';

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    margin-block-end: 1em;
  }
  .body {
    position: relative;
    padding: 0.5em;
    line-height: 1.3;
    box-sizing: border-box;
    width: 100%;
    background-color: ${theme.hoverBackgroundColor};
    border-radius: ${theme.smallRound};
  }
  .body::after {
    position: absolute;
    content: '';
    top: 100%;
    border: 0.6em solid transparent;
    transform: translateY(-50%);
    border-inline-start-color: ${theme.noticeColor};
    right: 0;
    border-inline-color: transparent ${theme.hoverBackgroundColor};
  }
  .info {
    font-size: 0.75em;
    opacity: 0.7;
    display: flex;
    gap: 0.5em;
    margin-block-end: 0.5em;
  }
  .username {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
`);

/**
 * @customElement m-lobby-msg
 */
@customElement('m-lobby-msg')
@adoptedStyle(style)
export class MLobbyMsgElement extends GemElement {
  @property msg?: LobbyMessage;

  render = () => {
    if (!this.msg) return html``;

    const { createdAt, nickname, text } = this.msg;
    return html`
      <div class="body">
        <div class="info">
          <span class="username">${nickname}</span>
          <span>${formatTime(createdAt)}</span>
        </div>
        <div>${text}</div>
      </div>
    `;
  };
}
