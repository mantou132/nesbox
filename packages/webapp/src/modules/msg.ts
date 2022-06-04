import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, property, state, part } from '@mantou/gem';
import { Time } from 'duoyun-ui/lib/time';

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
  }
  :host(:where(:--self, [data-self])) .body {
    background-color: ${theme.describeColor};
  }
  .body::after {
    position: absolute;
    content: '';
    top: 100%;
    border: 0.35em solid transparent;
    transform: translateY(-50%);
    border-inline-start-color: ${theme.noticeColor};
    left: 0;
    border-inline-color: ${theme.noticeColor} transparent;
  }
  :host(:where(:--self, [data-self])) .body::after {
    left: auto;
    right: 0;
    border-inline-color: transparent ${theme.describeColor};
  }
  .time {
    font-size: 0.75em;
    opacity: 0.6;
  }
`);

/**
 * @customElement m-msg
 */
@customElement('m-msg')
@adoptedStyle(style)
export class MMsgElement extends GemElement {
  @part static body: string;
  @part static time: string;
  @property msg?: Message;

  @state self: boolean;

  render = () => {
    if (!this.msg) return html``;

    this.self = this.msg?.userId === configure.user?.id;

    return html`
      <div class="body" part=${MMsgElement.body}>
        <div class="time" part=${MMsgElement.time}>${new Time(this.msg.createdAt).format('HH:mm:ss')}</div>
        <div>${this.msg.body}</div>
      </div>
    `;
  };
}
