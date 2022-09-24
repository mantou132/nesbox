import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, property } from '@mantou/gem';

import { Room, store } from 'src/store';
import { theme } from 'src/theme';
import { getCDNSrc } from 'src/utils';
import { icons } from 'src/icons';

import 'duoyun-ui/elements/heading';
import 'duoyun-ui/elements/use';

const style = createCSSSheet(css`
  :host {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    border: 1px solid ${theme.borderColor};
    border-radius: ${theme.normalRound};
    overflow: hidden;
  }
  :host(:hover) {
    background-color: ${theme.lightBackgroundColor};
  }
  .cover {
    width: 100%;
    aspect-ratio: 256/240;
    object-fit: cover;
    background: black;
  }
  .info {
    display: flex;
    flex-direction: column;
    padding: 0.75em;
    gap: 0.5em;
  }
  .text {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .heading {
    margin: 0;
  }
  .users {
    display: flex;
    align-items: center;
    color: ${theme.describeColor};
    font-size: 0.875em;
  }
  .icon {
    display: flex;
    align-items: center;
  }
  .icon {
    width: 1.5em;
    flex-shrink: 0;
  }
  .name {
    min-width: 0;
    flex-grow: 1;
    padding-inline-end: 1em;
  }
`);

/**
 * @customElement m-room-item
 */
@customElement('m-room-item')
@adoptedStyle(style)
export class MRoomItemElement extends GemElement {
  @property room: Room;

  render = () => {
    const game = store.games[this.room.gameId || 0];
    const hostNickname = this.room.users.find((u) => this.room.host === u.id)?.nickname;
    const preview = game ? getCDNSrc(game.preview) : '';
    return html`
      <img class="cover" draggable="false" loading="lazy" src=${this.room.screenshot || preview} />
      <div class="info">
        <dy-heading lv="4" class="heading text" title=${game?.name || ''}>${game?.name}</dy-heading>
        <div class="users">
          <span class="name text">${hostNickname}</span>
          <dy-use class="icon" .element=${icons.group}></dy-use>
          <span>${this.room.users.length}</span>
        </div>
      </div>
    `;
  };
}
