import { adoptedStyle, aria, css, customElement, GemElement, html, mounted, property } from '@mantou/gem';
import { ContextMenu } from 'duoyun-ui/elements/contextmenu';
import { commonHandle } from 'duoyun-ui/lib/hotkeys';
import { configure, toggleFriendListState } from 'src/configure';
import { ScFriendStatus, ScUserStatus } from 'src/generated/graphql';
import { i18n } from 'src/i18n/basic';
import { icons } from 'src/icons';
import { acceptFriend, createInvite, deleteFriend } from 'src/services/api';
import { type Friend, store, toggleFriendChatState } from 'src/store';
import { theme } from 'src/theme';
import { getAvatar } from 'src/utils/common';

import 'duoyun-ui/elements/avatar';
import 'duoyun-ui/elements/help-text';
import 'duoyun-ui/elements/use';
import 'src/modules/badge';

import { createDecoratorTheme } from '@mantou/gem/helper/theme';

const elementTheme = createDecoratorTheme({ order: 0, opacity: 0 });

const style = css`
  :scope {
    cursor: default;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    padding: 0.5em;
    gap: 0.5em;
    order: ${elementTheme.order}
  }
  :scope:where(:state(active), :hover, :focus) {
    background-color: ${theme.lightBackgroundColor};
  }
  :scope .action:where(:state(active), :hover, :focus) {
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
    width: 0;
    flex-grow: 1;
    caret-color: currentColor;
  }
  .content,
  .actions {
    opacity: ${elementTheme.opacity};
  }
  .nickname,
  .playing {
    display: block;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .action {
    border-radius: ${theme.smallRound};
    width: 1.2em;
    padding: 0.2em;
  }
  :scope:hover .action,
  .action:where(:state(active), :hover) {
    display: inline-flex;
  }
`;

@customElement('m-friend-item')
@adoptedStyle(style)
@aria({ focusable: true })
export class MFriendItemElement extends GemElement {
  @property friend: Friend;

  get #isOnline() {
    return this.friend.user.status === ScUserStatus.Online;
  }

  get #isFriend() {
    return this.friend.status === ScFriendStatus.Accept;
  }

  @mounted()
  #init = () => {
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', commonHandle);
  };

  @elementTheme()
  #theme = () => ({
    opacity: this.#isOnline ? 1 : 0.4,
    order: !this.#isFriend ? 0 : this.#isOnline ? 1 : 2,
  });

  #deleteFriend = async (id: number, activeElement: HTMLElement) => {
    await ContextMenu.confirm(i18n.get('page.friend.deleteConfirm'), { activeElement, width: '16em', danger: true });
    deleteFriend(id);
  };

  #onAcceptFriend = (evt: Event, accept: boolean) => {
    evt.stopPropagation();
    acceptFriend(this.friend.user.id, accept);
  };

  #onMoreMenu = (evt: Event) => {
    const activeElement = evt.target as HTMLElement;
    evt.stopPropagation();
    ContextMenu.open(
      [
        {
          text: i18n.get('page.friend.invite'),
          disabled: !configure.user?.playing,
          handle: () => {
            createInvite({ targetId: this.friend.user.id, roomId: configure.user!.playing!.id });
          },
        },
        {
          text: i18n.get('page.friend.delete'),
          danger: true,
          handle: () => this.#deleteFriend(this.friend.user.id, activeElement),
        },
      ],
      {
        activeElement,
      },
    );
  };

  #onClick = () => {
    toggleFriendChatState(this.friend!.user.id);
    toggleFriendListState();
  };

  render = () => {
    const { username, nickname, playing, id } = this.friend.user;

    return html`
      <dy-avatar
        class="avatar"
        status=${this.#isOnline ? 'positive' : 'default'}
        src=${getAvatar(username)}
      ></dy-avatar>
      <div class="content">
        <div class="nickname">${nickname}</div>
        <dy-help-text class="playing" status=${this.#isOnline && playing ? 'positive' : 'default'}>
          ${
            !this.#isOnline || !this.#isFriend
              ? ''
              : playing
                ? i18n.get('page.friend.playing', store.games[playing.gameId]?.name || '')
                : i18n.get('page.friend.notPlaying')
          }
        </dy-help-text>
      </div>
      <m-badge .friendid=${id}></m-badge>
      ${
        this.#isFriend
          ? html`<dy-use class="action" .element=${icons.more} @click=${this.#onMoreMenu}></dy-use>`
          : html`
            <dy-use
              class="action"
              .element=${icons.check}
              @click=${(e: Event) => this.#onAcceptFriend(e, true)}
            ></dy-use>
            <dy-use
              class="action"
              .element=${icons.close}
              @click=${(e: Event) => this.#onAcceptFriend(e, false)}
            ></dy-use>
          `
      }
    `;
  };
}
