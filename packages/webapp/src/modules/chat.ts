import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  property,
  refobject,
  RefObject,
  classMap,
} from '@mantou/gem';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';

import { changeFriendChatDraft, friendStore } from 'src/store';
import { createMessage, getMessages, readMessage } from 'src/services/api';
import { icons } from 'src/icons';
import { theme } from 'src/theme';
import { toggoleFriendChatState } from 'src/configure';
import { ScUserStatus } from 'src/generated/graphql';
import { i18n } from 'src/i18n';

import 'duoyun-ui/elements/use';
import 'duoyun-ui/elements/result';
import 'duoyun-ui/elements/action-text';
import 'duoyun-ui/elements/status-light';
import 'duoyun-ui/elements/input';
import 'src/modules/msg';

const style = createCSSSheet(css`
  :host {
    position: fixed;
    inset: auto 1rem 1rem auto;
    display: flex;
    flex-direction: column;
    width: 20em;
    background-color: ${theme.lightBackgroundColor};
    border: 1px solid ${theme.borderColor};
    box-shadow: 0 5px 10px rgba(0, 0, 0, calc(${theme.maskAlpha} - 0.15));
  }
  .header {
    display: flex;
    align-items: center;
    border-bottom: 1px solid ${theme.borderColor};
    padding: 0 0 0 0.5em;
  }
  .title {
    font-weight: bold;
    flex-direction: row-reverse;
  }
  .close {
    padding: 0.3em;
    width: 1.2em;
    margin: 0.5em;
  }
  .close:hover {
    background-color: ${theme.hoverBackgroundColor};
  }
  .list {
    flex-grow: 1;
    padding: 0.3em 0.5em;
    height: 15em;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    overflow: auto;
    scrollbar-width: none;
    overscroll-behavior: contain;
  }
  .notlastmsg::part(body) {
    overflow: hidden;
  }
  .recent::part(time) {
    display: none;
  }
  .input {
    width: auto;
    margin: 0.5em;
  }
`);

/**
 * @customElement m-chat
 */
@customElement('m-chat')
@adoptedStyle(style)
@connectStore(i18n.store)
@connectStore(friendStore)
export class MChatElement extends GemElement {
  @refobject messageRef: RefObject<HTMLElement>;
  @property friendId: number;

  get #friend() {
    return friendStore.friends[this.friendId];
  }

  get #isOnLine() {
    return this.#friend?.user.status === ScUserStatus.Online;
  }

  #onKeyDown = (evt: KeyboardEvent) => {
    evt.stopPropagation();
    hotkeys({
      enter: () => {
        const msg = friendStore.draft[this.friendId];
        if (msg) createMessage(this.friendId, msg);
        changeFriendChatDraft(this.friendId);
      },
      esc: () => {
        const msg = friendStore.draft[this.friendId];
        if (msg) {
          changeFriendChatDraft(this.friendId);
        } else {
          toggoleFriendChatState();
        }
      },
    })(evt);
  };

  mounted = () => {
    getMessages(this.friendId).then(() => readMessage(this.friendId));
    this.effect(
      () => {
        this.messageRef.element?.scrollTo(0, 10000);
      },
      () => [friendStore.messageIds[this.friendId]],
    );
  };

  render = () => {
    return html`
      <div class="header">
        <dy-status-light class="title" .status=${this.#isOnLine ? 'positive' : 'default'}>
          ${this.#friend?.user.nickname}
        </dy-status-light>
        <span style="flex-grow: 1"></span>
        <dy-use class="close" .element=${icons.close} @click=${() => toggoleFriendChatState()}></dy-use>
      </div>
      <div ref=${this.messageRef.ref} class="list">
        ${friendStore.messageIds[this.friendId]?.map(
          (id, i, arr) =>
            html`
              <m-msg
                class=${classMap({
                  msg: true,
                  notlastmsg: friendStore.messages[id]?.userId === friendStore.messages[arr[i + 1] || 0]?.userId,
                  recent:
                    friendStore.messages[id]?.userId === friendStore.messages[arr[i - 1] || 0]?.userId &&
                    Number(friendStore.messages[id]?.createdAt) -
                      Number(friendStore.messages[arr[i - 1] || 0]?.createdAt) <
                      5 * 60_000,
                })}
                .msg=${friendStore.messages[id]}
              ></m-msg>
            `,
        )}
      </div>
      <dy-input
        autofocus
        class="input"
        placeholder=${i18n.get('placeholderMessage')}
        @change=${({ detail }: CustomEvent<string>) => changeFriendChatDraft(this.friendId, detail)}
        @keydown=${this.#onKeyDown}
        .value=${friendStore.draft[this.friendId] || ''}
      ></dy-input>
    `;
  };
}
