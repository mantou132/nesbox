import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  boolattribute,
} from '@mantou/gem';
import type { RouteItem } from 'duoyun-ui/elements/route';

import { routes } from 'src/routes';
import { i18n } from 'src/i18n';
import { configure, toggoleFriendListState } from 'src/configure';
import { theme } from 'src/theme';
import { leaveRoom } from 'src/services/api';
import { store } from 'src/store';
import { icons } from 'src/icons';

import 'duoyun-ui/elements/link';
import 'duoyun-ui/elements/use';
import 'duoyun-ui/elements/action-text';
import 'duoyun-ui/elements/modal';
import 'src/modules/game-selector';
import 'src/elements/tooltip';
import 'src/modules/avatar';

type State = {
  select: boolean;
};

const style = createCSSSheet(css`
  :host {
    display: flex;
    position: sticky;
    top: 0;
    z-index: 1;
    background: ${theme.backgroundColor};
  }
  :host([room]) {
    background: linear-gradient(${theme.lightBackgroundColor} -60%, transparent);
  }
  .nav {
    width: min(100%, ${theme.mainWidth});
    box-sizing: border-box;
    padding: 0.5em ${theme.gridGutter};
    margin: auto;
    display: flex;
    align-items: center;
    gap: 1em;
  }
  :host([room]) .nav {
    width: 100%;
  }
  .link {
    margin-block-start: -3px;
    border-bottom: 2px solid transparent;
    text-transform: uppercase;
    font-size: 1.25em;
  }
  .link:where(:--active, [data-active]) {
    border-bottom-color: currentColor;
  }
  .title {
    font-size: 1.5em;
  }
  .icon {
    width: 3em;
    box-sizing: border-box;
  }
  dy-use.icon {
    padding: 0.3em;
  }
  dy-use.icon:hover {
    background-color: ${theme.hoverBackgroundColor};
  }
`);

/**
 * @customElement m-nav
 */
@customElement('m-nav')
@adoptedStyle(style)
@connectStore(configure)
@connectStore(store)
@connectStore(i18n.store)
export class MNavElement extends GemElement<State> {
  @boolattribute room: boolean;

  state: State = {
    select: false,
  };

  render = () => {
    return html`
      <nav class="nav">
        ${this.room
          ? html`
              <nesbox-tooltip .content=${i18n.get('leaveRoom')}>
                <dy-use class="icon" .element=${icons.left} @click=${leaveRoom}></dy-use>
              </nesbox-tooltip>
              ${
                configure.user?.playing?.host !== configure.user?.id
                  ? html`<div class="title">${store.games[configure.user?.playing?.gameId || 0]?.name}</div>`
                  : html`
                      <nesbox-tooltip .content=${i18n.get('selectGame')}>
                        <dy-action-text class="title" @click=${() => this.setState({ select: true })}>
                          ${store.games[configure.user?.playing?.gameId || 0]?.name}
                        </dy-action-text>
                      </nesbox-tooltip>
                    `
              }
              </nesbox-tooltip>
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
                <img class="icon" src="/logo-96.png"></img>
              </dy-link>
              <dy-active-link class="link" .route=${routes.games as RouteItem}>${routes.games.title}</dy-active-link>
              <dy-active-link class="link" .route=${routes.favorites as RouteItem}>
              ${routes.favorites.title}
              </dy-active-link>
              <dy-active-link class="link" .route=${routes.rooms as RouteItem}>${routes.rooms.title}</dy-active-link>
          `}
        <span style="flex-grow: 1;"></span>
        <dy-use class="action icon" .element=${icons.group} @click=${toggoleFriendListState}></dy-use>
        <m-avatar class="icon"></m-avatar>
      </nav>
    `;
  };
}
