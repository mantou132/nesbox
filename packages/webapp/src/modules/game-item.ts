import { adoptedStyle, boolattribute, css, customElement, GemElement, history, html, property } from '@mantou/gem';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { createPath } from 'duoyun-ui/elements/route';
import { paramKeys, viewTransitionName } from 'src/constants';
import { i18n } from 'src/i18n/basic';
import { icons } from 'src/icons';
import { routes } from 'src/routes';
import { createRoom, favoriteGame } from 'src/services/api';
import type { Game } from 'src/store';
import { theme } from 'src/theme';
import { getCDNSrc, setViewTransitionName } from 'src/utils/common';

import 'duoyun-ui/elements/use';
import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/space';
import 'duoyun-ui/elements/modal';

const style = css`
  :scope {
    position: relative;
    display: block;
  }
  .actions {
    position: absolute;
    top: 0.3em;
    right: 0.3em;
  }
  .actions dy-button {
    box-shadow: 0 0.1em 0.5em rgba(0, 0, 0, 0.3);
  }
  :scope:not(:hover):not(:focus) .play {
    opacity: 0;
  }
  .cover {
    cursor: pointer;
    width: 100%;
    aspect-ratio: 503/348;
    border-radius: ${theme.normalRound};
    object-fit: cover;
    box-shadow: 0 0 0 0.5px ${theme.borderColor};
    image-rendering: pixelated;
    filter: ${theme.imageFilter};
  }
  .title {
    padding: 0.3em 0.5em;
    text-align: center;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  @media (hover) {
    :scope:hover .cover {
      opacity: 0.7;
    }
  }
`;

@customElement('m-game-item')
@adoptedStyle(style)
export class MGameItemElement extends GemElement {
  @boolattribute favorited: boolean;

  @property game: Game;

  #onFavoriteClick = (evt: Event) => {
    evt.stopPropagation();
    favoriteGame(this.game.id, !this.favorited);
    (evt.target as HTMLElement).blur?.();
  };

  #onGameClick = async () => {
    await createRoom({ gameId: this.game.id, private: false });
  };

  #onMoreClick = (evt: Event) => {
    setViewTransitionName(this, viewTransitionName.PREVIEW);
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
      <img draggable="false" class="cover" @click=${this.#onMoreClick} src=${getCDNSrc(this.game.preview)} />
      <dy-space class="actions" size="small">
        <dy-button data-cy="start" class="play" small ?hidden=${mediaQuery.isPhone} @click=${this.#onGameClick}>
          ${i18n.get('page.game.start')}
        </dy-button>
        <dy-button
          data-cy="favorite"
          small
          tabindex="-1"
          color="cancel"
          @click=${this.#onFavoriteClick}
          .icon=${this.favorited ? icons.favorited : icons.favorite}
        ></dy-button>
      </dy-space>
      <div class="title" title=${this.game.name}>${this.game.name}</div>
    `;
  };
}
