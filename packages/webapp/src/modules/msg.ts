import {
  adoptedStyle,
  boolattribute,
  css,
  customElement,
  GemElement,
  html,
  property,
  shadow,
  state,
} from '@mantou/gem';
import { configure } from 'src/configure';
import type { Message } from 'src/store';
import { theme } from 'src/theme';
import { formatTime } from 'src/utils/common';

const style = css`
  :host {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }
  :host(:state(self)) {
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
  :host(:state(self)) .body {
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
  :host(:state(self)) .body::after {
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
`;

@customElement('m-msg')
@adoptedStyle(style)
// Firefox bug: https://bugzilla.mozilla.org/show_bug.cgi?id=1914099
@shadow()
export class MMsgElement extends GemElement {
  @property msg?: Message;

  @boolattribute time: boolean;
  @boolattribute last: boolean;

  @state self: boolean;

  render = () => {
    if (!this.msg) return html``;

    this.self = this.msg?.userId === configure.user?.id;

    return html`
      <div v-if=${this.time} class="time">${formatTime(this.msg.createdAt)}</div>
      <div class="body">
        <div>${this.msg.body}</div>
      </div>
    `;
  };
}
