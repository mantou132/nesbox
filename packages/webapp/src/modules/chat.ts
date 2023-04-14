import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  refobject,
  RefObject,
} from '@mantou/gem';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';

import { changeFriendChatDraft, friendStore, toggleFriendChatState } from 'src/store';
import { createMessage, getMessages, readMessage } from 'src/services/api';
import { icons } from 'src/icons';
import { theme } from 'src/theme';
import { ScUserStatus } from 'src/generated/graphql';
import { i18n } from 'src/i18n/basic';

import 'duoyun-ui/elements/use';
import 'duoyun-ui/elements/result';
import 'duoyun-ui/elements/action-text';
import 'duoyun-ui/elements/status-light';
import 'duoyun-ui/elements/input';
import 'src/modules/msg';

const style = createCSSSheet(css`
  :host {
    position: fixed;
    z-index: ${theme.popupZIndex};
    inset: auto 1rem 1rem auto;
    display: flex;
    flex-direction: column;
    width: 20em;
    height: min(24em, calc(100vh - 2em));
    background-color: ${theme.lightBackgroundColor};
    border: 1px solid ${theme.borderColor};
    box-shadow: 0 0.3em 0.75em rgba(0, 0, 0, calc(${theme.maskAlpha} - 0.15));
    box-sizing: border-box;
    border-radius: ${theme.normalRound};
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
    border-radius: ${theme.smallRound};
  }
  .close:hover {
    background-color: ${theme.hoverBackgroundColor};
  }
  .list {
    flex-grow: 1;
    padding: 0.3em 0.5em;
    display: flex;
    flex-direction: column;
    gap: 0.2em;
    overflow: auto;
    overscroll-behavior: contain;
    scrollbar-width: none;
  }
  .list::-webkit-scrollbar {
    display: none;
  }
  .input {
    width: auto;
    margin: 0.5em;
    flex-shrink: 0;
    border-radius: ${theme.smallRound};
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

  get #friend() {
    if (friendStore.friendChatState) {
      return friendStore.friends[friendStore.friendChatState];
    }
  }

  get #isOnLine() {
    return this.#friend?.user.status === ScUserStatus.Online;
  }

  #onKeyDown = (evt: KeyboardEvent) => {
    evt.stopPropagation();
    hotkeys({
      enter: () => {
        const msg = friendStore.draft[friendStore.friendChatState!];
        if (msg) createMessage(friendStore.friendChatState!, msg);
        changeFriendChatDraft(friendStore.friendChatState!);
      },
      esc: () => {
        const msg = friendStore.draft[friendStore.friendChatState!];
        if (msg) {
          changeFriendChatDraft(friendStore.friendChatState!);
        } else {
          toggleFriendChatState();
        }
      },
    })(evt);
  };

  mounted = () => {
    this.effect(
      async () => {
        if (friendStore.friendChatState) {
          await getMessages(friendStore.friendChatState);
        }
        // 保证用户看到信息后才清除未读
        if (friendStore.friendChatState) {
          readMessage(friendStore.friendChatState);
        }
      },
      () => [friendStore.friendChatState],
    );
    this.effect(
      () => {
        this.messageRef.element?.scrollTo(0, 10000);
      },
      () => [friendStore.messageIds[friendStore.friendChatState || 0]],
    );
  };

  render = () => {
    if (!friendStore.friendChatState) {
      return html`
        <style>
          :host {
            display: none !important;
          }
        </style>
      `;
    }

    return html`
      <div class="header">
        <dy-status-light class="title" .status=${this.#isOnLine ? 'positive' : 'default'}>
          ${this.#friend?.user.nickname}
        </dy-status-light>
        <span style="flex-grow: 1"></span>
        <dy-use class="close" .element=${icons.close} @click=${() => toggleFriendChatState()}></dy-use>
      </div>
      <div ref=${this.messageRef.ref} class="list">
        ${friendStore.messageIds[friendStore.friendChatState]?.map(
          (
            id,
            index,
            arr,
            prevCreatedAt = Number(friendStore.messages[arr[index - 1] || 0]?.createdAt),
            createdAt = Number(friendStore.messages[id]?.createdAt),
            nextCreatedAt = Number(friendStore.messages[arr[index + 1] || 0]?.createdAt),
            recent = createdAt - prevCreatedAt < 5 * 60_000,
            recent2 = nextCreatedAt - createdAt > 5 * 60_000,
            someUser = friendStore.messages[id]?.userId !== friendStore.messages[arr[index + 1] || 0]?.userId,
          ) =>
            html`
              <m-msg
                .time=${!index || !recent}
                .last=${someUser || (!someUser && recent2)}
                .msg=${friendStore.messages[id]}
              ></m-msg>
            `,
        )}
      </div>
      <dy-input
        autofocus
        class="input"
        placeholder=${i18n.get('placeholder.message')}
        @change=${({ detail }: CustomEvent<string>) => changeFriendChatDraft(friendStore.friendChatState!, detail)}
        @keydown=${this.#onKeyDown}
        .value=${friendStore.draft[friendStore.friendChatState] || ''}
      ></dy-input>
    `;
  };
}
