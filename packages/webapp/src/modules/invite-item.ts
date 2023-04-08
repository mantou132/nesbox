import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, property } from '@mantou/gem';

import { friendStore, Invite, store } from 'src/store';
import { theme } from 'src/theme';
import { icons } from 'src/icons';
import { acceptInvite } from 'src/services/api';
import { toggleFriendListState } from 'src/configure';
import { i18n } from 'src/i18n/basic';
import { ScUserStatus } from 'src/generated/graphql';

const style = createCSSSheet(css`
  :host {
    display: block;
    border: 1px solid ${theme.informativeColor};
    padding: 1em 0.5em 1em 1em;
  }
  .invite {
    display: flex;
    align-items: center;
    font-size: 0.875em;
  }
  .title {
    width: 80%;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    margin-block-end: 0.3em;
  }
  .action {
    border-radius: ${theme.smallRound};
    width: 1.2em;
    padding: 0.2em;
    opacity: 0.7;
  }
  .action:where(:--active, [data-active], :hover, :focus) {
    opacity: 1;
  }
  .invite-tip {
    opacity: 0.7;
    flex-grow: 1;
    min-width: 0;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
`);

/**
 * @customElement m-invite-item
 */
@customElement('m-invite-item')
@adoptedStyle(style)
export class MInviteItemElement extends GemElement {
  @property invite: Invite;

  #onAcceptInvite = (evt: Event) => {
    evt.stopPropagation();
    acceptInvite(this.invite.id, true);
    toggleFriendListState();
  };

  #onDenyInvite = (evt: Event) => {
    evt.stopPropagation();
    acceptInvite(this.invite.id, false);
    toggleFriendListState();
  };

  render = () => {
    const friend = friendStore.friends[this.invite.userId];
    if (friend?.user.status === ScUserStatus.Offline) {
      return html`
        <style>
          :host {
            display: none !important;
          }
        </style>
      `;
    }
    return html`
      <div class="title">${store.games[this.invite.room.gameId]?.name || ''}</div>
      <div class="invite">
        <div class="invite-tip">${i18n.get('sendToMeInvite', friend?.user.nickname || i18n.get('unknown'))}</div>
        <dy-use class="action" .element=${icons.check} @click=${this.#onAcceptInvite}></dy-use>
        <dy-use class="action" .element=${icons.close} @click=${this.#onDenyInvite}></dy-use>
      </div>
    `;
  };
}
