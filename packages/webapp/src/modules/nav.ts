import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  attribute,
  history,
  updateStore,
} from '@mantou/gem';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { commonHandle } from 'duoyun-ui/lib/hotkeys';
import { waitLoading } from 'duoyun-ui/elements/wait';
import { focusStyle } from 'duoyun-ui/lib/styles';
import { locationStore, routes } from 'src/routes';
import { createPath, RouteItem } from 'duoyun-ui/elements/route';

import { viewTransitionName } from 'src/constants';
import { i18n } from 'src/i18n/basic';
import {
  configure,
  SearchCommand,
  setSearchCommand,
  toggleFriendListState,
  toggleSearchState,
  toggleSideNavState,
  navStore,
} from 'src/configure';
import { theme } from 'src/theme';
import { createRoom, favoriteGame, leaveRoom } from 'src/services/api';
import { store } from 'src/store';
import { icons } from 'src/icons';
import { AppRootElement } from 'src/app';
import { gotoLogin } from 'src/auth';

import 'duoyun-ui/elements/link';
import 'duoyun-ui/elements/use';
import 'duoyun-ui/elements/action-text';
import 'duoyun-ui/elements/button';
import 'src/elements/tooltip';
import 'src/modules/avatar';
import 'src/modules/badge';

const style = createCSSSheet(css`
  :host {
    position: relative;
    z-index: 1;
    display: flex;
    view-transition-name: ${viewTransitionName.HEADER};
    box-shadow: ${theme.titleBarColor} 0px 1px 0px;
    --height: 3em;
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
  .link:where(:--active, [data-active])::after {
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
    :host {
      --height: 2.5em;
    }
    .nav {
      gap: 0.5em;
      padding: 0.5em 0.75em;
    }
    .icon {
      border-radius: 100%;
    }
    .link:not(:where(:--active, [data-active])) {
      display: none;
    }
    .link:where(:--active, [data-active])::after {
      display: none;
    }
    .play,
    .group,
    .avatar {
      display: none;
    }
  }
`);

export const mountedRoom = () => updateStore(navStore, { room: true });
export const unmountedRoom = () => updateStore(navStore, { room: false });

/**
 * @customElement m-nav
 */
@customElement('m-nav')
@adoptedStyle(style)
@adoptedStyle(focusStyle)
@connectStore(navStore)
@connectStore(store)
@connectStore(locationStore)
@connectStore(i18n.store)
@connectStore(configure)
export class MNavElement extends GemElement {
  @attribute page: 'room' | 'game' | '';

  #share = () => {
    navigator
      .share?.({
        url: location.href,
        text: store.games[Number(this.id)]?.name,
      })
      .catch(() => {
        //
      });
  };

  #goTop = (event: MouseEvent) => {
    event.preventDefault();
    this.closestElement(AppRootElement)?.contentRef.element?.scrollTo({
      left: 0,
      top: 0,
      behavior: 'smooth',
    });
  };

  #renderLinks = () => {
    return [routes.games, routes.favorites, routes.rooms].map(
      (route: RouteItem) => html`
        <dy-active-link class="link" .route=${route} .pattern=${route.pattern}>${route.title}</dy-active-link>
      `,
    );
  };

  #renderRoomTitle = () => {
    const playing = configure.user?.playing;
    const gameId = playing?.gameId || 0;

    return html`
      <nesbox-tooltip .position=${'bottom'} .content=${i18n.get('leaveRoom')}>
        <dy-use
          data-cy="back"
          class="icon"
          tabindex="0"
          @keydown=${commonHandle}
          .element=${icons.left}
          @click=${() => waitLoading(leaveRoom())}
        ></dy-use>
      </nesbox-tooltip>
      ${playing?.host !== configure.user?.id
        ? html`<div class="title">${store.games[gameId]?.name}</div>`
        : html`
            <nesbox-tooltip .position=${'bottom'} .content=${i18n.get('selectGame')}>
              <dy-action-text
                class="title"
                tabindex="0"
                @keydown=${commonHandle}
                @click=${() => setSearchCommand(SearchCommand.SELECT_GAME)}
              >
                ${store.games[gameId]?.name}
              </dy-action-text>
            </nesbox-tooltip>
          `}
      ${this.#renderFavoriteBtn(gameId)}
    `;
  };

  #renderFavoriteBtn = (gameId: number) => {
    const favorited = store.favoriteIds?.includes(gameId);
    return html`
      <dy-use
        class="icon heart"
        tabindex="0"
        @keydown=${commonHandle}
        data-cy="favorite"
        .element=${favorited ? icons.favorited : icons.favorite}
        @click=${() => favoriteGame(gameId, !favorited)}
      ></dy-use>
    `;
  };

  #renderGameTitle = () => {
    const gameId = Number(this.id);
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

  render = () => {
    return html`
      <style>
        :host {
          background-color: ${navStore.room ? 'black' : theme.backgroundColor};
          background-image: ${navStore.room
            ? `linear-gradient(${theme.lightBackgroundColor} -60%, transparent)`
            : 'none'};
        }
      </style>
      <nav class="nav">
        ${this.page === 'game'
          ? this.#renderGameTitle()
          : this.page === 'room'
          ? this.#renderRoomTitle()
          : mediaQuery.isPhone
          ? this.#renderNavMenu()
          : this.#renderLinks()}
        <span class="space" @dblclick=${this.#goTop}></span>
        ${!configure.user
          ? html`<dy-action-text @click=${gotoLogin} data-cy="login">${i18n.get('login')}</dy-action-text>`
          : this.page === 'game'
          ? html`
              <dy-use
                class="icon"
                tabindex="0"
                ?hidden=${!navigator.share}
                @keydown=${commonHandle}
                .element=${icons.share}
                @click=${this.#share}
              ></dy-use>
              ${mediaQuery.isPhone
                ? this.#renderFavoriteBtn(Number(this.id))
                : html`
                    <dy-button
                      data-cy="start"
                      class="play"
                      @click=${() => createRoom({ gameId: Number(this.id), private: false })}
                    >
                      ${i18n.get('startGame')}
                    </dy-button>
                  `}
            `
          : this.#renderMenu()}
      </nav>
    `;
  };
}
