import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore, state } from '@mantou/gem';
import type { RouteItem } from 'duoyun-ui/elements/route';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';

import { locationStore, routes } from 'src/routes';
import { i18n } from 'src/i18n';
import { configure, toggoleFriendListState, toggoleSearchState } from 'src/configure';
import { theme } from 'src/theme';
import { favoriteGame, leaveRoom } from 'src/services/api';
import { store } from 'src/store';
import { icons } from 'src/icons';

import 'duoyun-ui/elements/link';
import 'duoyun-ui/elements/use';
import 'duoyun-ui/elements/action-text';
import 'duoyun-ui/elements/modal';
import 'src/modules/game-selector';
import 'src/elements/tooltip';
import 'src/modules/avatar';
import 'src/modules/badge';

type State = {
  select: boolean;
};

const style = createCSSSheet(css`
  :host {
    display: flex;
    background: ${theme.backgroundColor};
  }
  :host(:where(:--room, [data-room])) {
    position: absolute;
    z-index: 1;
    top: 0;
    width: 100%;
    background-color: black;
    background-image: linear-gradient(${theme.lightBackgroundColor} -60%, transparent);
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
  :host(:where(:--room, [data-room])) .nav {
    width: 100%;
  }
  .link {
    line-height: 1.5;
    border-bottom: 3px solid transparent;
    text-transform: uppercase;
    font-size: 1.125em;
  }
  .link:where(:--active, [data-active]) {
    border-bottom-color: currentColor;
  }
  .title {
    font-size: 1.5em;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }
  .icon {
    width: 3em;
    box-sizing: border-box;
  }
  dy-use.icon {
    padding: 0.5em;
  }
  dy-use.icon:hover {
    background-color: ${theme.hoverBackgroundColor};
  }
  @media ${mediaQuery.PHONE} {
    .link {
      display: none;
    }
  }
`);

/**
 * @customElement m-nav
 */
@customElement('m-nav')
@adoptedStyle(style)
@connectStore(store)
@connectStore(locationStore)
@connectStore(i18n.store)
export class MNavElement extends GemElement<State> {
  @state room: boolean;

  state: State = {
    select: false,
  };

  render = () => {
    const playing = configure.user?.playing;
    const gameId = playing?.gameId || 0;
    const favorited = store.favoriteIds?.includes(gameId || 0);

    this.room = !!playing;

    return html`
      <nav class="nav">
        ${this.room
          ? html`
              <nesbox-tooltip .position=${'bottom'} .content=${i18n.get('leaveRoom')}>
                <dy-use class="icon" .element=${icons.left} @click=${leaveRoom}></dy-use>
              </nesbox-tooltip>
              ${playing?.host !== configure.user?.id
                ? html`<div class="title">${store.games[gameId || 0]?.name}</div>`
                : html`
                    <nesbox-tooltip .position=${'bottom'} .content=${i18n.get('selectGame')}>
                      <dy-action-text class="title" @click=${() => this.setState({ select: true })}>
                        ${store.games[gameId || 0]?.name}
                      </dy-action-text>
                    </nesbox-tooltip>
                  `}
              <dy-use
                class="icon"
                .element=${favorited ? icons.favorited : icons.favorite}
                @click=${() => favoriteGame(gameId, !favorited)}
              ></dy-use>
              <dy-modal
                .open=${this.state.select}
                .disableDefualtOKBtn=${true}
                .header=${i18n.get('selectGame')}
                @close=${() => this.setState({ select: false })}
                .maskCloseable=${true}
              >
                <m-game-selector slot="body"></m-game-selector>
              </dy-modal>
            `
          : html`
              <dy-link style="display: contents" href="/">
                <img class="icon" src="/logo-96.png" />
              </dy-link>
              <dy-active-link class="link" .route=${routes.games as RouteItem}>${routes.games.title}</dy-active-link>
              <dy-active-link class="link" .route=${routes.favorites as RouteItem}>
                ${routes.favorites.title}
              </dy-active-link>
              <dy-active-link class="link" .route=${routes.rooms as RouteItem}>${routes.rooms.title}</dy-active-link>
            `}
        <span style="flex-grow: 1;"></span>
        <dy-use class="icon" .element=${icons.search} @click=${toggoleSearchState}></dy-use>
        <dy-use class="icon" .element=${icons.group} @click=${toggoleFriendListState}>
          <m-badge></m-badge>
        </dy-use>
        <m-avatar class="icon"></m-avatar>
      </nav>
    `;
  };
}
