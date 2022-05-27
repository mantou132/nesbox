import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  property,
  globalemitter,
  Emitter,
  boolattribute,
  connectStore,
} from '@mantou/gem';

import { theme } from 'src/theme';
import { configure } from 'src/configure';
import { Role, RoleOffer } from 'src/rtc';
import { icons } from 'src/icons';
import { i18n } from 'src/i18n';

import 'duoyun-ui/elements/avatar';
import 'duoyun-ui/elements/use';

const style = createCSSSheet(css`
  :host {
    display: flex;
    gap: 1em;
    font-size: 0.875em;
  }
`);

/**
 * @customElement m-room-player-list
 */
@customElement('m-room-player-list')
@adoptedStyle(style)
export class MRoomPlayerListElement extends GemElement {
  @property roles: Role[];
  @property isHost: boolean;

  render = () => {
    return html`${[
      [this.roles[1], this.roles[2], this.roles[3], this.roles[4]].map(
        (role, index) =>
          html`<m-room-player-item .host=${this.isHost} .role=${role} .roleType=${index + 1}></m-room-player-item>`,
      ),
    ]}`;
  };
}

const itemStyle = createCSSSheet(css`
  :host {
    display: flex;
    gap: 0.5em;
    align-items: center;
    background-color: ${theme.lightBackgroundColor};
    width: 8em;
    flex-shrink: 0;
  }
  :host(:hover) {
    background-color: ${theme.hoverBackgroundColor};
  }
  * {
    pointer-events: none;
  }
  .avatar {
    flex-shrink: 0;
    width: calc(2.2em + 2px);
  }
  .username {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
    padding-inline-end: 0.3em;
    min-width: 0;
  }
  .username span {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
`);

/**
 * @customElement m-room-player-item
 */
@customElement('m-room-player-item')
@adoptedStyle(itemStyle)
@connectStore(i18n.store)
export class MRoomPlayerItemElement extends GemElement {
  @property role: Role;
  @property roleType: number;
  @boolattribute host: boolean;

  @globalemitter rolechange: Emitter<RoleOffer>;
  @globalemitter kickout: Emitter<number>;

  constructor() {
    super();
    this.addEventListener('click', this.#onClick);
  }

  get #isSelf() {
    return this.role && this.role.userId === configure.user?.id;
  }

  get #isHostRole() {
    return this.roleType === 1;
  }

  get #isJoinable() {
    return !this.host && !this.role;
  }

  get #isKickoutable() {
    return this.host && this.role && !this.#isSelf;
  }

  get #isLeaveable() {
    return !this.host && this.#isSelf;
  }

  #onClick = () => {
    if (this.#isJoinable) {
      this.rolechange(new RoleOffer(this.roleType));
    }
    if (this.#isKickoutable) {
      this.kickout(this.role!.userId);
    }
    if (this.#isLeaveable) {
      this.rolechange(new RoleOffer(0));
    }
  };

  render = () => {
    if (!this.role) {
      return html`
        <style>
          :host {
            border: 1px solid ${theme.borderColor};
          }
        </style>
        <dy-avatar class="avatar" square src=${`https://ui-avatars.com/api/?name=P${this.roleType}`}></dy-avatar>
        <div class="username">
          ${this.#isJoinable ? html`<dy-use .element=${icons.received}></dy-use>` : i18n.get('roomEmptyRole')}
        </div>
      `;
    }
    return html`
      <style>
        :host {
          border: 1px solid ${this.#isSelf ? theme.noticeColor : theme.borderColor};
          cursor: ${this.#isHostRole ? 'not-allowed' : 'default'};
        }
      </style>
      <dy-avatar class="avatar" square src=${`https://joeschmoe.io/api/v1/${this.role?.username}`}></dy-avatar>
      <div class="username">
        <span>${this.role.username}</span>
      </div>
    `;
  };
}