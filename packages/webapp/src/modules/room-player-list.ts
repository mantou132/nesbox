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
import { commonHandle } from 'duoyun-ui/lib/hotkeys';

import { theme } from 'src/theme';
import { configure } from 'src/configure';
import { Role, RoleOffer } from 'src/rtc';
import { icons } from 'src/icons';
import { i18n } from 'src/i18n';
import { getAvatar } from 'src/utils';

import 'duoyun-ui/elements/avatar';
import 'duoyun-ui/elements/use';

const style = createCSSSheet(css`
  :host {
    display: flex;
    gap: 1em;
    font-size: 0.875em;
    max-width: 100%;
    flex-wrap: wrap;
    justify-content: space-evenly;
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
    height: calc(2.2em + 2px);
    box-sizing: border-box;
    flex-shrink: 0;
    border-radius: ${theme.smallRound};
    overflow: hidden;
  }
  :host(:hover) {
    background-color: ${theme.hoverBackgroundColor};
  }
  * {
    pointer-events: none;
  }
  .avatar {
    flex-shrink: 0;
    height: 100%;
  }
  .avatar::part(avatar) {
    border-radius: 0;
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
  .icon {
    width: 1.5em;
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
    this.addEventListener('keydown', commonHandle);
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
          ${this.#isHostRole
            ? html`<dy-use class="icon" .element=${icons.loading}></dy-use>`
            : this.#isJoinable
            ? html`<dy-use class="icon" tabindex="0" .element=${icons.received}></dy-use>`
            : i18n.get('roomEmptyRole')}
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
      <dy-avatar class="avatar" square src=${getAvatar(this.role?.username)}></dy-avatar>
      <div class="username">
        <span>${this.role.username}</span>
      </div>
    `;
  };
}
