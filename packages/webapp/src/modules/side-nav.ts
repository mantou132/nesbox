import {
  adoptedStyle,
  boolattribute,
  connectStore,
  css,
  customElement,
  effect,
  GemElement,
  history,
  html,
} from '@mantou/gem';
import type { SwipeEventDetail } from 'duoyun-ui/elements/gesture';
import { gotoLogin, logout } from 'src/auth';
import { configure, toggleSideNavState } from 'src/configure';
import { i18n } from 'src/i18n/basic';
import { routes } from 'src/routes';
import { theme } from 'src/theme';
import { getAvatar } from 'src/utils/common';

import 'duoyun-ui/elements/action-text';
import 'duoyun-ui/elements/side-navigation';
import 'duoyun-ui/elements/space';

const style = css`
  :scope {
    position: absolute;
    display: flex;
    justify-content: space-between;
    align-items: stretch;
    width: 100vw;
    height: 100%;
    top: 0;
    left: 0;
    transition: all 0.3s ${theme.timingEasingFunction};
    transform: translateX(calc(-100vw + ${theme.gridGutter}));
    transform-origin: left center;
    z-index: 2;
  }
  :scope[open] {
    transform: translateX(5vw) scale(0.9);
  }
  .nav {
    display: flex;
    flex-direction: column;
    width: 80vw;
    background: ${theme.backgroundColor};
    border-radius: 0.5em;
    box-sizing: border-box;
    padding: 1em;
  }
  .nav * {
    font-size: ${1 / 0.9}em;
  }
`;

@customElement('m-side-nav')
@adoptedStyle(style)
@connectStore(configure)
@connectStore(history.store)
export class MSideNavElement extends GemElement {
  @boolattribute open: boolean;

  #onSwipe = ({ detail }: CustomEvent<SwipeEventDetail>) => {
    if (detail.direction === 'right') {
      toggleSideNavState(true);
    }
    if (detail.direction === 'left') {
      toggleSideNavState(false);
    }
  };

  @effect(() => [history.getParams().path])
  #setSideNavState = () => toggleSideNavState(false);

  render = () => {
    this.open = !!configure.sideNavState;

    return html`
      <dy-reflect>
        <style>
          body {
            background: black !important;
          }
        </style>
      </dy-reflect>
      <dy-gesture class="nav" @swipe=${this.#onSwipe}>
        <dy-side-navigation
          .items=${[routes.games, routes.favorites].filter((e) => !!e.getContent)}
        ></dy-side-navigation>
        <span style="flex-grow: 1"></span>
        <dy-space v-if=${!!configure.user} @click=${logout}>
          <dy-avatar size="small" src=${getAvatar(configure.user?.username)}></dy-avatar>
          <dy-action-text color=${theme.negativeColor}>
            ${i18n.get('menu.account.logout', configure.user?.username || '')}
          </dy-action-text>
        </dy-space>
        <dy-action-text v-else @click=${gotoLogin}>${i18n.get('menu.account.login')}</dy-action-text>
      </dy-gesture>
      <dy-gesture @swipe=${this.#onSwipe} @click=${() => toggleSideNavState(false)} style="flex-grow: 1;"></dy-gesture>
    `;
  };
}
