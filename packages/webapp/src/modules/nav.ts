import { adoptedStyle, connectStore, css, customElement, GemElement, history, html } from '@mantou/gem';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { createPath, type RouteItem } from 'duoyun-ui/elements/route';
import { waitLoading } from 'duoyun-ui/elements/wait';
import { commonHandle } from 'duoyun-ui/lib/hotkeys';
import { focusStyle } from 'duoyun-ui/lib/styles';
import { AppRootElement } from 'src/app';
import { gotoLogin } from 'src/auth';
import {
  configure,
  navStore,
  SearchCommand,
  setSearchCommand,
  toggleFriendListState,
  toggleSearchState,
  toggleSideNavState,
} from 'src/configure';
import { paramKeys, viewTransitionName } from 'src/constants';
import { i18n } from 'src/i18n/basic';
import { icons } from 'src/icons';
import { locationStore, routes } from 'src/routes';
import { createRoom, favoriteGame, leaveRoom } from 'src/services/api';
import { store } from 'src/store';
import { theme } from 'src/theme';
import { matchRoute } from 'src/utils/common';

import 'duoyun-ui/elements/action-text';
import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/link';
import 'duoyun-ui/elements/use';
import 'src/elements/nav-link';
import 'src/elements/tooltip';
import 'src/modules/avatar';
import 'src/modules/badge';

import { createDecoratorTheme } from '@mantou/gem/helper/theme';
import { closestElement } from 'duoyun-ui/lib/element';

const elementTheme = createDecoratorTheme({ backgroundColor: '', backgroundImg: '' });

const style = css`
  :scope {
    position: relative;
    z-index: 1;
    display: flex;
    view-transition-name: ${viewTransitionName.HEADER};
    box-shadow: ${theme.titleBarColor} 0px 1px 0px;
    --height: 3em;
    background-color: ${elementTheme.backgroundColor};
    background-image: ${elementTheme.backgroundImg};
  }
  .nav {
    width: 100%;
    box-sizing: border-box;
    padding: 0.5em ${theme.gridGutter};
    margin: auto;
    display: flex;
    align-items: center;
    gap: 1em;
  }
  .link {
    line-height: 1.5;
    text-transform: uppercase;
    font-size: 1.125em;
    white-space: nowrap;
  }
  .link::after {
    content: '';
    display: block;
    background: transparent;
    height: 3px;
    width: 80%;
    margin: auto;
    border-radius: ${theme.normalRound};
  }
  .link:state(match)::after {
    background: currentColor;
  }
  .title {
    font-size: 1.5em;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .space {
    flex-grow: 1;
    align-self: stretch;
    height: var(--height);
  }
  .icon {
    flex-shrink: 0;
    width: var(--height);
    box-sizing: border-box;
    border-radius: ${theme.normalRound};
  }
  dy-use.icon {
    padding: 0.5em;
  }
  dy-use.icon:hover {
    background-color: ${theme.hoverBackgroundColor};
  }
  @media ${mediaQuery.PHONE} {
    :scope {
      --height: 2.5em;
    }
    .nav {
      gap: 0.5em;
      padding: 0.5em 0.75em;
    }
    .icon {
      border-radius: 100%;
    }
    .link:not(:state(match)),
    .link:state(match)::after,
    .play,
    .group,
    .avatar {
      display: none;
    }
  }
`;

export const mountedRoom = () => navStore({ room: true });
export const unmountedRoom = () => navStore({ room: false });

@customElement('m-nav')
@adoptedStyle(style)
@adoptedStyle(focusStyle)
@connectStore(navStore)
@connectStore(store)
@connectStore(locationStore)
@connectStore(configure)
export class MNavElement extends GemElement {
  get #gamePageParams() {
    return matchRoute(routes.game);
  }

  get #gameId() {
    return Number(this.#gamePageParams?.[paramKeys.GAME_ID]);
  }

  get #roomPageParams() {
    return matchRoute(routes.room);
  }

  #share = () => {
    navigator
      .share?.({
        url: location.href,
        text: store.games[this.#gameId]?.name,
      })
      .catch(() => {
        //
      });
  };

  #goTop = (event: MouseEvent) => {
    event.preventDefault();
    closestElement(this, AppRootElement)?.contentRef.value?.scrollTo({
      left: 0,
      top: 0,
      behavior: 'smooth',
    });
  };

  #renderLinks = () => {
    return [routes.games, routes.favorites, routes.rooms].map(
      (route: RouteItem) => html`
        <nesbox-nav-link class="link" .route=${route} .pattern=${route.pattern}>${route.title}</nesbox-nav-link>
      `,
    );
  };

  #renderRoomTitle = () => {
    const playing = configure.user?.playing;
    const gameId = playing?.gameId || 0;

    return html`
      <nesbox-tooltip .position=${'bottom'} .content=${i18n.get('tooltip.room.leave')}>
        <dy-use
          data-cy="back"
          class="icon"
          tabindex="0"
          @keydown=${commonHandle}
          .element=${icons.left}
          @click=${() => waitLoading(leaveRoom())}
        ></dy-use>
      </nesbox-tooltip>
      ${
        playing?.host !== configure.user?.id
          ? html`<div class="title">${store.games[gameId]?.name}</div>`
          : html`
            <nesbox-tooltip .position=${'bottom'} .content=${i18n.get('tooltip.game.change')}>
              <dy-action-text
                class="title"
                tabindex="0"
                @keydown=${commonHandle}
                @click=${() => setSearchCommand(SearchCommand.SELECT_GAME)}
              >
                ${store.games[gameId]?.name}
              </dy-action-text>
            </nesbox-tooltip>
          `
      }
      ${this.#renderFavoriteBtn(gameId)}
    `;
  };

  #renderFavoriteBtn = (gameId: number) => {
    const favorited = store.favoriteIds?.includes(gameId);
    return html`
      <nesbox-tooltip
        .position=${'bottom'}
        .content=${favorited ? i18n.get('tooltip.game.cancelFavorite') : i18n.get('tooltip.game.favorite')}
      >
        <dy-use
          class="icon heart"
          tabindex="0"
          @keydown=${commonHandle}
          data-cy="favorite"
          .element=${favorited ? icons.favorited : icons.favorite}
          @click=${() => favoriteGame(gameId, !favorited)}
        ></dy-use>
      </nesbox-tooltip>
    `;
  };

  #renderGameTitle = () => {
    const gameId = this.#gameId;
    return html`
      <dy-use
        data-cy="back"
        class="icon"
        tabindex="0"
        @keydown=${commonHandle}
        .element=${icons.left}
        @click=${() => {
          history.push({ path: createPath(routes.games) });
        }}
      ></dy-use>
      <div class="title">${store.games[gameId]?.name}</div>
      ${mediaQuery.isPhone ? '' : this.#renderFavoriteBtn(gameId)}
    `;
  };

  #renderNavMenu = () => {
    return html`
      <dy-use
        class="icon"
        tabindex="0"
        @keydown=${commonHandle}
        .element=${icons.menu}
        @click=${toggleSideNavState}
      ></dy-use>
      ${this.#renderLinks()}
    `;
  };

  #renderMenu = () => {
    return html`
      <dy-use
        class="icon"
        tabindex="0"
        @keydown=${commonHandle}
        .element=${icons.search}
        @click=${toggleSearchState}
      ></dy-use>
      <dy-use
        class="icon group"
        tabindex="0"
        @keydown=${commonHandle}
        .element=${icons.group}
        @click=${toggleFriendListState}
      >
        <m-badge></m-badge>
      </dy-use>
      <m-avatar class="icon avatar"></m-avatar>
    `;
  };

  @elementTheme()
  #theme = () => ({
    backgroundImg: navStore.room ? `linear-gradient(${theme.lightBackgroundColor} -60%, transparent)` : 'none',
    backgroundColor: navStore.room ? 'black' : theme.backgroundColor,
  });

  render = () => {
    return html`
      <nav class="nav">
        ${
          this.#gamePageParams
            ? this.#renderGameTitle()
            : this.#roomPageParams
              ? this.#renderRoomTitle()
              : mediaQuery.isPhone
                ? this.#renderNavMenu()
                : this.#renderLinks()
        }
        <span class="space" @dblclick=${this.#goTop}></span>
        ${
          !configure.user
            ? html`<dy-action-text @click=${gotoLogin} data-cy="login">${i18n.get('menu.account.login')}</dy-action-text>`
            : this.#gamePageParams
              ? html`
              <dy-use
                class="icon"
                tabindex="0"
                ?hidden=${!navigator.share}
                @keydown=${commonHandle}
                .element=${icons.share}
                @click=${this.#share}
              ></dy-use>
              ${
                mediaQuery.isPhone
                  ? this.#renderFavoriteBtn(this.#gameId)
                  : html`
                    <dy-button
                      data-cy="start"
                      class="play"
                      @click=${() => createRoom({ gameId: this.#gameId, private: false })}
                    >
                      ${i18n.get('page.game.start')}
                    </dy-button>
                  `
              }
            `
              : this.#renderMenu()
        }
      </nav>
    `;
  };
}
