import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  boolattribute,
  history,
} from '@mantou/gem';
import { routes } from 'src/routes';
import { SwipeEventDetail } from 'duoyun-ui/elements/gesture';

import { configure, toggleSideNavState } from 'src/configure';
import { theme } from 'src/theme';
import { i18n } from 'src/i18n/basic';
import { gotoLogin, logout } from 'src/auth';
import { getAvatar } from 'src/utils/common';

import 'duoyun-ui/elements/side-navigation';
import 'duoyun-ui/elements/action-text';
import 'duoyun-ui/elements/space';

const style = createCSSSheet(css`
  :host {
    position: absolute;
    display: block;
    width: 100vw;
    height: 100vh;
    top: 0;
    left: 0;
    transition: all 0.3s ${theme.timingEasingFunction};
    transform: translateX(-100vw);
    transform-origin: left center;
  }
  :host([open]) {
    transform: translateX(5vw) scale(0.9);
  }
  .nav {
    display: flex;
    flex-direction: column;
    width: 80vw;
    height: 100%;
    background: ${theme.backgroundColor};
    border-radius: 0.5em;
    box-sizing: border-box;
    padding: 2em 1em;
  }
  .nav * {
    font-size: ${1 / 0.9}em;
  }
`);

/**
 * @customElement m-side-nav
 */
@customElement('m-side-nav')
@adoptedStyle(style)
@connectStore(configure)
@connectStore(history.store)
export class MSideNavElement extends GemElement {
  @boolattribute open: boolean;

  #onSwipe = ({ detail }: CustomEvent<SwipeEventDetail>) => {
    if (detail.direction === 'left' && configure.sideNavState) {
      toggleSideNavState();
    }
  };

  mounted = () => {
    this.effect(
      () => configure.sideNavState && toggleSideNavState(),
      () => [history.getParams().path],
    );
  };

  render = () => {
    this.open = !!configure.sideNavState;

    return html`
      <dy-gesture class="nav" @swipe=${this.#onSwipe}>
        <dy-side-navigation
          .items=${[routes.games, routes.favorites].filter((e) => !!e.getContent)}
        ></dy-side-navigation>
        <span style="flex-grow: 1"></span>
        ${configure.user
          ? html`
              <dy-space @click=${logout}>
                <dy-avatar size="small" src=${getAvatar(configure.user?.username)}></dy-avatar>
                <dy-action-text color=${theme.negativeColor}>
                  ${i18n.get('logoutAccount', configure.user?.username || '')}
                </dy-action-text>
              </dy-space>
            `
          : html`<dy-action-text @click=${gotoLogin}>${i18n.get('login')}</dy-action-text>`}
      </dy-gesture>
    `;
  };
}
