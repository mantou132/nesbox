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
  styleMap,
} from '@mantou/gem';
import { commonHandle } from 'duoyun-ui/lib/hotkeys';
import { focusStyle } from 'duoyun-ui/lib/styles';
import { ContextMenu } from 'duoyun-ui/elements/menu';
import { isNotBoolean } from 'duoyun-ui/lib/types';
import { getAvatar, getCDNSrc } from 'src/utils';
import { Player } from '@mantou/nes';

import { theme } from 'src/theme';
import { configure } from 'src/configure';
import { Role, RoleOffer } from 'src/rtc';
import { icons } from 'src/icons';
import { i18n } from 'src/i18n';
import { voiceStore } from 'src/modules/room-voice';
import { applyFriend } from 'src/services/api';
import { friendStore } from 'src/store';

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
  @property roles: Partial<Record<Player, Role>>;
  @property isHost: boolean;

  render = () => {
    return html`${[
      [Player.One, Player.Two, Player.Three, Player.Four].map(
        (roleType) =>
          html`
            <m-room-player-item
              .host=${this.isHost}
              .playerRole=${this.roles[roleType]}
              .roleType=${roleType}
            ></m-room-player-item>
          `,
      ),
    ]}`;
  };
}

const itemStyle = createCSSSheet(css`
  :host {
    position: relative;
    display: flex;
    gap: 0.5em;
    align-items: center;
    background-color: ${theme.lightBackgroundColor};
    width: 8em;
    height: calc(2.2em + 2px);
    box-sizing: border-box;
    flex-shrink: 0;
    border-radius: ${theme.smallRound};
  }
  .volume {
    position: absolute;
    top: -1em;
    left: -1em;
    width: 2em;
    transform: rotate(-30deg);
    transition: all 0.3s;
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
    width: auto;
  }
  .avatar::part(avatar) {
    border-radius: 0;
    border-start-start-radius: ${theme.smallRound};
    border-end-start-radius: ${theme.smallRound};
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
@adoptedStyle(focusStyle)
@connectStore(i18n.store)
@connectStore(voiceStore)
export class MRoomPlayerItemElement extends GemElement {
  @property playerRole: Role;
  @property roleType: Player;
  @boolattribute host: boolean;

  @globalemitter rolechange: Emitter<RoleOffer>;
  @globalemitter kickout: Emitter<number>;

  constructor() {
    super();
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', commonHandle);
  }

  get #isSelf() {
    return !!this.playerRole && this.playerRole.userId === configure.user?.id;
  }

  get #isHostRole() {
    return this.roleType === Player.One;
  }

  get #isJoinable() {
    return !this.host && !this.playerRole;
  }

  get #isAllowKickOut() {
    return !!(this.host && this.playerRole && !this.#isSelf);
  }

  get #isOther() {
    return !!this.playerRole && !this.#isSelf;
  }

  get #isAllowLeave() {
    return !this.host && this.#isSelf;
  }

  get #audioLevel() {
    return voiceStore.audioLevel[this.playerRole!.userId];
  }

  #onClick = () => {
    if (this.#isJoinable) {
      this.rolechange(new RoleOffer(this.roleType));
    }
    if (this.#isOther) {
      ContextMenu.open(
        [
          this.#isAllowKickOut && {
            text: i18n.get('kickOutRole'),
            handle: () => this.kickout(this.playerRole!.userId),
          },
          {
            text: i18n.get('addFriend'),
            disabled: !!friendStore.friends[this.playerRole!.userId],
            handle: () => applyFriend(this.playerRole!.username),
          },
        ].filter(isNotBoolean),
        { activeElement: this, width: '10em' },
      );
    }
    if (this.#isAllowLeave) {
      this.rolechange(new RoleOffer(null));
    }
  };

  render = () => {
    if (!this.playerRole) {
      return html`
        <style>
          :host {
            border: 1px solid ${theme.borderColor};
          }
        </style>
        <dy-avatar
          class="avatar"
          square
          src=${getCDNSrc(`https://ui-avatars.com/api/?name=P${Number(this.roleType) + 1}`)}
        ></dy-avatar>
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
        }
      </style>
      <dy-use
        class="volume"
        style=${styleMap({
          scale: 1 + Math.max(this.#audioLevel - 0.3, 0) / 3,
          opacity: this.#audioLevel > 0.1 ? 1 : 0,
        })}
        .element=${icons.volume}
      ></dy-use>
      <dy-avatar class="avatar" square src=${getAvatar(this.playerRole?.username)}></dy-avatar>
      <div class="username">
        <span>${this.playerRole.nickname}</span>
      </div>
    `;
  };
}
