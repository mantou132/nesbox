import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  updateStore,
  property,
  refobject,
  RefObject,
} from '@mantou/gem';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';

import { friendStore } from 'src/store';
import { createMessage, getMessages } from 'src/services/api';
import { icons } from 'src/icons';
import { theme } from 'src/theme';
import { toggoleFriendChatState } from 'src/configure';

import 'duoyun-ui/elements/use';
import 'duoyun-ui/elements/result';
import 'duoyun-ui/elements/action-text';
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
  }
  .header {
    display: flex;
    align-items: center;
    border-bottom: 1px solid ${theme.borderColor};
    padding: 0 0 0 0.5em;
  }
  .title {
    flex-grow: 1;
  }
  .close {
    padding: 0.3em;
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
@connectStore(friendStore)
export class MChatElement extends GemElement {
  @refobject messageRef: RefObject<HTMLElement>;
  @property friendId: number;

  #onChange = ({ detail }: CustomEvent<string>) => {
    updateStore(friendStore, { draft: { ...friendStore.draft, [this.friendId]: detail } });
  };

  #onKeyDown = (evt: KeyboardEvent) => {
    evt.stopPropagation();
    hotkeys({
      enter: () => {
        const msg = friendStore.draft[this.friendId];
        if (msg) createMessage(this.friendId, msg);
        updateStore(friendStore, { draft: { ...friendStore.draft, [this.friendId]: undefined } });
      },
      esc: () => {
        const msg = friendStore.draft[this.friendId];
        if (msg) {
          updateStore(friendStore, { draft: { ...friendStore.draft, [this.friendId]: undefined } });
        } else {
          toggoleFriendChatState();
        }
      },
    })(evt);
  };

  mounted = () => {
    getMessages(this.friendId);
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
        <div class="title">${friendStore.friends[this.friendId]?.user.nickname}</div>
        <dy-use class="close" .element=${icons.close} @click=${() => toggoleFriendChatState()}></dy-use>
      </div>
      <div ref=${this.messageRef.ref} class="list">
        ${friendStore.messageIds[this.friendId]?.map((id) => html`<m-msg .msg=${friendStore.messages[id]}></m-msg>`)}
      </div>
      <dy-input
        autofocus
        class="input"
        placeholder="Write message"
        @change=${this.#onChange}
        @keydown=${this.#onKeyDown}
        .value=${friendStore.draft[this.friendId] || ''}
      ></dy-input>
    `;
  };
}
