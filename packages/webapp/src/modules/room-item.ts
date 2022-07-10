import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, property } from '@mantou/gem';

import { Room, store } from 'src/store';
import { theme } from 'src/theme';
import { getAvatar, getCorsSrc } from 'src/utils';
import { configure } from 'src/configure';

import 'duoyun-ui/elements/avatar';
import 'duoyun-ui/elements/heading';

const style = createCSSSheet(css`
  :host {
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 1em;
    border: 1px solid ${theme.borderColor};
    border-radius: ${theme.normalRound};
    overflow: hidden;
  }
  :host(:hover) {
    background-color: ${theme.lightBackgroundColor};
  }
  .cover {
    width: 10em;
    aspect-ratio: 503/348;
    object-fit: cover;
  }
  .info {
    display: flex;
    flex-direction: column;
    gap: 1em;
    min-width: 0px;
  }
  .heading {
    margin: 0;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
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

    return html`
      <img class="cover" loading="lazy" src=${game ? getCorsSrc(game.preview) : ''} />
      <div class="info">
        <dy-heading lv="4" class="heading">${configure.user?.nickname}-${game?.name}</dy-heading>
        <dy-avatar-group
          class="users"
          max="9"
          .data=${this.room.users.map((e) => ({
            src: getAvatar(e.username),
            tooltip: e.nickname,
          }))}
        >
        </dy-avatar-group>
      </div>
    `;
  };
}
