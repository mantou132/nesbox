import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, property, updateStore } from '@mantou/gem';
import { ContextMenu } from 'duoyun-ui/elements/menu';
import { Toast } from 'duoyun-ui/elements/toast';

import { Friend, friendStore, Invite, store } from 'src/store';
import { theme } from 'src/theme';
import { ScUserStatus } from 'src/generated/graphql';
import { icons } from 'src/icons';
import { acceptFriend, acceptInvite, createInvite } from 'src/services/api';
import { configure, toggoleFriendChatState, toggoleFriendListState } from 'src/configure';
import { i18n } from 'src/i18n';

import 'duoyun-ui/elements/avatar';
import 'duoyun-ui/elements/help-text';
import 'duoyun-ui/elements/divider';
import 'duoyun-ui/elements/use';

const style = createCSSSheet(css`
  :host {
    cursor: default;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 0.5em;
    gap: 0.5em;
    border-width: 1px;
    border-style: solid;
  }
  :host(:where(:--active, [data-active], :hover)) {
    background-color: ${theme.lightBackgroundColor};
  }
  :host .action:where(:--active, [data-active], :hover) {
    background-color: ${theme.hoverBackgroundColor};
  }
  .avatar {
    width: 3em;
    aspect-ratio: 1;
  }
  .avatar::part(avatar) {
    box-sizing: border-box;
    border: 2px solid ${theme.lightBackgroundColor};
  }
  .content {
    flex-grow: 1;
    caret-color: currentColor;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    width: 0;
  }
  .action {
    width: 1.5em;
    padding: 0.2em;
  }
  :not(.invite) .action {
    display: none;
  }
  :host(:hover) .action,
  .action:where(:--active, [data-active], :hover) {
    display: inline-flex;
  }
  .divider {
    width: 100%;
  }
  .invite {
    width: 100%;
    display: flex;
    align-items: center;
  }
  .invite-tip {
    flex-grow: 1;
    min-width: 0;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
`);

/**
 * @customElement m-friend-item
 */
@customElement('m-friend-item')
@adoptedStyle(style)
export class MFriendItemElement extends GemElement {
  @property friend: Friend;
  @property invite?: Invite;

  get #isOnline() {
    return this.friend.user.status === ScUserStatus.Online;
  }

  constructor() {
    super();
    this.addEventListener('click', this.#onClick);
  }

  #deleteFriend = async (id: number, activeElement: HTMLElement) => {
    await ContextMenu.confirm(i18n.get('deleteFriendConfirm'), { activeElement, width: '16em', danger: true });
    await acceptFriend(id, false);
    friendStore.messageIds[id]?.forEach((id) => delete friendStore.messages[id]);
    updateStore(friendStore, {
      draft: { ...friendStore.draft, [id]: undefined },
      messageIds: { ...friendStore.messageIds, [id]: undefined },
    });
  };

  #onMoreMenu = (evt: Event) => {
    const activeElement = evt.target as HTMLElement;
    evt.stopPropagation();
    ContextMenu.open(
      [
        {
          text: i18n.get('inviteFriend'),
          disabled: !configure.user?.playing,
          handle: async () => {
            await createInvite(this.friend.user.id, configure.user!.playing!.id);
            Toast.open('success', i18n.get('tipIviteSuccess'));
          },
        },
        {
          text: i18n.get('deleteFriend'),
          danger: true,
          handle: () => this.#deleteFriend(this.friend.user.id, activeElement),
        },
      ],
      {
        activeElement,
      },
    );
  };

  #onAcceptInvite = (evt: Event) => {
    evt.stopPropagation();
    acceptInvite(this.invite!.id, true);
    toggoleFriendListState();
  };

  #onDenyInvite = (evt: Event) => {
    evt.stopPropagation();
    acceptInvite(this.invite!.id, false);
    toggoleFriendListState();
  };

  #onClick = () => {
    toggoleFriendChatState(this.friend!.user.id);
    toggoleFriendListState();
  };

  render = () => {
    const { username, nickname, playing } = this.friend.user;

    return html`
      <style>
        .content,
        .actions {
          opacity: ${this.#isOnline ? 1 : 0.4};
        }
        :host {
          order: ${this.invite || this.#isOnline ? 0 : 1};
          border-color: ${this.invite ? theme.informativeColor : 'transparent'};
        }
      </style>
      <dy-avatar
        class="avatar"
        status=${this.#isOnline ? 'positive' : 'negative'}
        src="https://joeschmoe.io/api/v1/${username}"
      ></dy-avatar>
      <div class="content">
        <div class="nickname">${nickname}</div>
        <dy-help-text status=${this.#isOnline && playing ? 'positive' : 'default'}>
          ${!this.#isOnline ? '' : playing ? `正在玩《${store.games[playing.gameId]?.name}》` : '中场休息'}
        </dy-help-text>
      </div>
      <dy-use class="action" .element=${icons.more} @click=${this.#onMoreMenu}></dy-use>
      ${this.invite
        ? html`
            <dy-divider class="divider"></dy-divider>
            <div class="invite">
              <div class="invite-tip">发来邀请</div>
              <dy-use class="action" .element=${icons.check} @click=${this.#onAcceptInvite}></dy-use>
              <dy-use class="action" .element=${icons.close} @click=${this.#onDenyInvite}></dy-use>
            </div>
          `
        : ''}
    `;
  };
}
