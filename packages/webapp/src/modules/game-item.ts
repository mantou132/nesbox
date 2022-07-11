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
  connectStore,
} from '@mantou/gem';
import { createPath } from 'duoyun-ui/elements/route';

import { icons } from 'src/icons';
import { Game } from 'src/store';
import { createRoom, favoriteGame } from 'src/services/api';
import { routes } from 'src/routes';
import { paramKeys } from 'src/constants';
import { i18n } from 'src/i18n';
import { theme } from 'src/theme';
import { getCDNSrc } from 'src/utils';

import 'duoyun-ui/elements/use';
import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/modal';

const style = createCSSSheet(css`
  :host {
    position: relative;
    display: flex;
    border-radius: ${theme.normalRound};
    overflow: hidden;
  }
  .play {
    position: absolute;
    top: 0.5em;
    right: 0.5em;
    border-radius: ${theme.smallRound};
  }
  :host(:not(:hover):not(:focus)) .play {
    opacity: 0;
  }
  .cover {
    cursor: pointer;
    width: 100%;
    aspect-ratio: 503/348;
    object-fit: cover;
  }
  :host(:hover) .cover {
    opacity: 0.7;
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
    backdrop-filter: blur(1px);
  }
  .title {
    flex-grow: 1;
    min-width: 0;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .favorite {
    width: 1.3em;
  }
`);

/**
 * @customElement m-game-item
 */
@customElement('m-game-item')
@adoptedStyle(style)
@connectStore(i18n.store)
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
      <img class="cover" loading="lazy" @click=${this.#onMoreClick} src=${getCDNSrc(this.game.preview)} />
      ${this.silent
        ? ''
        : html`<dy-button class="play" small @click=${this.#onGameClick}>${i18n.get('startGame')}</dy-button>`}
      <div class="footer">
        <span class="title" title=${this.game.name}>${this.game.name}</span>
        ${this.silent
          ? ''
          : html`
              <dy-use
                class="favorite"
                @click=${this.#onFavoriteClick}
                .element=${this.favorited ? icons.favorited : icons.favorite}
              ></dy-use>
            `}
      </div>
    `;
  };
}
