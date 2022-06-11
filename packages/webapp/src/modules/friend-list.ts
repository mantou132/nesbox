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
    box-sizing: border-box;
    background-color: ${theme.backgroundColor};
    display: flex;
    flex-direction: column;
    box-shadow: 0 0px 10px rgba(0, 0, 0, calc(${theme.maskAlpha} - 0.15));
  }
  .list {
    overscroll-behavior: contain;
    min-height: auto;
    flex-grow: 1;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }
  .actions {
    display: flex;
    flex-direction: column;
    gap: 1em;
    padding: 1em;
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
      header: i18n.get('addFriend'),
      body: html`
        <dy-input
          autofocus
          style="width: 100%"
          placeholder=${i18n.get('placeholderUsername')}
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
      <div class="actions">
        <dy-button color=${theme.textColor} @click=${this.#addFriend} type="reverse" .icon=${icons.addPerson}>
          ${i18n.get('addFriend')}
        </dy-button>
      </div>
    `;
  };
}
