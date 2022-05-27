import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  property,
  boolattribute,
  history,
} from '@mantou/gem';
import { createPath } from 'duoyun-ui/elements/route';

import { icons } from 'src/icons';
import { Game } from 'src/store';
import { createRoom, favoriteGame } from 'src/services/api';
import { routes } from 'src/routes';
import { paramKeys } from 'src/constants';

import 'duoyun-ui/elements/use';
import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/modal';

const style = createCSSSheet(css`
  :host {
    position: relative;
    display: flex;
  }
  .play {
    position: absolute;
    top: 0.5em;
    right: 0.5em;
  }
  :host(:not(:hover)) .play {
    display: none;
  }
  .cover {
    cursor: pointer;
    width: 100%;
    aspect-ratio: 503/348;
    object-fit: cover;
  }
  .footer {
    padding: 0.3em 0.5em;
    position: absolute;
    inset: auto 0 0 0;
    display: flex;
    gap: 0.5em;
    align-items: center;
    justify-content: space-between;
    background-color: rgba(0, 0, 0, 0.6);
  }
  .title {
    flex-grow: 1;
    min-width: 0;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .favorite {
    height: 1.3em;
  }
`);

/**
 * @customElement m-game-item
 */
@customElement('m-game-item')
@adoptedStyle(style)
export class MGameItemElement extends GemElement {
  @boolattribute favorited: boolean;
  @boolattribute silent: boolean;

  @property game: Game;

  #onFavoriteClick = (evt: Event) => {
    evt.stopPropagation();
    favoriteGame(this.game.id, !this.favorited);
  };

  #onGameClick = async () => {
    await createRoom({ gameId: this.game.id, private: false });
  };

  #onMoreClick = (evt: Event) => {
    if (this.silent) return;
    evt.stopPropagation();
    history.push({
      path: createPath(routes.game, {
        params: {
          [paramKeys.GAME_ID]: String(this.game.id),
        },
      }),
    });
  };

  render = () => {
    return html`
      ${this.silent ? '' : html`<dy-button class="play" small @click=${this.#onGameClick}>开始游戏</dy-button>`}
      <img class="cover" @click=${this.#onMoreClick} src=${this.game.preview}></img>
      <div class="footer">
        <span class="title">${this.game.name}</span>
        ${
          this.silent
            ? ''
            : html`
                <dy-use
                  class="favorite"
                  @click=${this.#onFavoriteClick}
                  .element=${this.favorited ? icons.favorited : icons.favorite}
                ></dy-use>
              `
        }
      </div>
    `;
  };
}
