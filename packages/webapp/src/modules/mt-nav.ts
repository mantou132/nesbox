import { GemElement, connectStore, html, adoptedStyle, customElement, createCSSSheet, css } from '@mantou/gem';
import { RouteItem } from 'duoyun-ui/elements/route';

import { configure } from 'src/configure';
import { theme } from 'src/theme';
import { getAvatar } from 'src/utils';
import { i18n } from 'src/i18n';
import { routes } from 'src/routes';

import 'duoyun-ui/elements/avatar';
import 'duoyun-ui/elements/link';
import 'src/elements/battery';
import 'src/elements/net';
import 'src/elements/time';

const style = createCSSSheet(css`
  :host {
    position: relative;
    display: flex;
    place-items: center;
    place-content: space-between;
    padding: calc(1.2 * ${theme.gridGutter}) calc(2 * ${theme.gridGutter});
    font-size: 0.875em;
  }
  .user {
    display: grid;
    place-items: center;
    grid-template: 'avatar nickname' 1fr;
  }
  .avatar {
    grid-area: avatar;
    margin-inline-end: 0.5em;
  }
  .links {
    position: absolute;
    display: flex;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    gap: 2vw;
  }
  .link {
    padding: 0.4em 1em;
    border-radius: 10em;
  }
  .link:where(:--active, [data-active]) {
    background: rgba(0, 0, 0, 0.3);
  }
  .status {
    display: flex;
    place-items: center;
    gap: 0.5em;
  }
`);

/**
 * @customElement m-mt-nav
 */
@customElement('m-mt-nav')
@adoptedStyle(style)
@connectStore(configure)
@connectStore(i18n.store)
export class MMtNavElement extends GemElement {
  render = () => {
    return html`
      <div class="user">
        <dy-avatar class="avatar" square src=${getAvatar(configure.user?.username)}></dy-avatar>
        <span class="nickname">${configure.user?.nickname}</span>
      </div>
      <div class="links">
        <dy-active-link class="link" .route=${routes.games as RouteItem}>${i18n.get('gamesTitle')}</dy-active-link>
        <dy-active-link class="link">${i18n.get('favoritesTitle')}</dy-active-link>
        <dy-active-link class="link">${i18n.get('roomsTitle')}</dy-active-link>
      </div>
      <div class="status">
        <nesbox-net class="net"></nesbox-net>
        <nesbox-battery class="battery"></nesbox-battery>
        <nesbox-time class="time"></nesbox-time>
      </div>
    `;
  };
}
