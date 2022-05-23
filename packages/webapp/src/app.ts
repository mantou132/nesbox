import { GemElement, customElement, html, connectStore, css, createCSSSheet, adoptedStyle, history } from '@mantou/gem';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { Loadbar } from 'duoyun-ui/elements/page-loadbar';
import { createPath } from '@mantou/gem/elements/route';

import { configure, getShortcut } from 'src/configure';
import { routes, locationStore } from 'src/routes';
import { getAccount, getFriends, subscribeEvent } from 'src/services/api';
import { paramKeys } from 'src/constants';

import 'duoyun-ui/elements/input-capture';

const style = createCSSSheet(css`
  main {
    max-width: 90em;
    margin: auto;
  }
`);

@customElement('app-root')
@connectStore(configure)
@adoptedStyle(style)
export class AppRootElement extends GemElement {
  #onLoading = () => {
    Loadbar.start();
  };

  #onChange = async () => {
    Loadbar.end();
    document.body.scrollTo(0, 0);
  };

  #globalShortcut = (evt: KeyboardEvent) => {
    hotkeys({
      [getShortcut('OPEN_HELP')]: console.log,
    })(evt);
  };

  mounted = () => {
    this.effect(
      () => {
        const rid = configure.user?.playing?.id;
        if (rid) {
          history.replace({
            path: createPath(routes.room, { params: { [paramKeys.ROOM_ID]: String(rid) } }),
          });
        }
      },
      () => [configure.user?.playing?.id],
    );
    getAccount();
    getFriends();
    addEventListener('keydown', this.#globalShortcut);
    const subscription = subscribeEvent();
    return () => {
      removeEventListener('keydown', this.#globalShortcut);
      subscription.return?.();
    };
  };

  render = () => {
    return html`
      <main class="main" aria-label="Content">
        <gem-route
          @loading=${this.#onLoading}
          @routechange=${this.#onChange}
          .routes=${routes}
          .locationStore=${locationStore}
        ></gem-route>
      </main>
      ${configure.screencastMode ? html`<dy-input-capture></dy-input-capture>` : ''}
    `;
  };
}
