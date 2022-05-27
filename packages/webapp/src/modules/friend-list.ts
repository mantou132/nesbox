import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';
import { Modal } from 'duoyun-ui/elements/modal';
import type { DuoyunInputElement } from 'duoyun-ui/elements/input';

import { icons } from 'src/icons';
import { friendStore, Invite } from 'src/store';
import { i18n } from 'src/i18n';
import { applyFriend } from 'src/services/api';
import { theme } from 'src/theme';

import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/result';
import 'duoyun-ui/elements/input';
import 'src/modules/friend-item';

const style = createCSSSheet(css`
  :host {
    height: 100%;
    background-color: ${theme.backgroundColor};
    display: flex;
    flex-direction: column;
  }
  .list {
    overscroll-behavior: contain;
    min-height: auto;
    flex-grow: 1;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }
  .btn::part(button) {
    border: none;
  }
`);

/**
 * @customElement m-friend-list
 */
@customElement('m-friend-list')
@adoptedStyle(style)
@connectStore(friendStore)
export class MFriendListElement extends GemElement {
  constructor() {
    super();
    this.memo(
      () => {
        this.#inviteMap = new Map(
          friendStore.inviteIds?.map((id) => [friendStore.invites[id]?.userId, friendStore.invites[id]]),
        );
      },
      () => [friendStore.inviteIds],
    );
  }

  #inviteMap = new Map<number | undefined, Invite | undefined>();

  #addFriend = async () => {
    const input = await Modal.open<DuoyunInputElement>({
      header: '添加好友',
      body: html`
        <dy-input
          style="width: 100%"
          placeholder="username"
          @change=${(e: any) => (e.target.value = e.detail)}
        ></dy-input>
      `,
    });
    applyFriend(input.value);
  };

  render = () => {
    return html`
      <div class="list">
        ${!friendStore.friendIds?.length
          ? html`
              <dy-result
                style="width: 100%; height: 100%"
                .illustrator=${icons.person}
                .header=${i18n.get('notDataTitle')}
              ></dy-result>
            `
          : friendStore.friendIds?.map(
              (id) =>
                html`
                  <m-friend-item .friend=${friendStore.friends[id]!} .invite=${this.#inviteMap.get(id)}></m-friend-item>
                `,
            )}
      </div>
      <dy-button class="btn" @click=${this.#addFriend} type="reverse" .icon=${icons.addPerson}>添加好友</dy-button>
    `;
  };
}
