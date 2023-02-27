import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  createStore,
  connectStore,
  history,
  updateStore,
  QueryString,
} from '@mantou/gem';
import { createPath } from 'duoyun-ui/elements/route';
import { forever } from 'duoyun-ui/lib/utils';
import { Loadbar } from 'duoyun-ui/elements/page-loadbar';
import { Toast } from 'duoyun-ui/elements/toast';
import { isNotNullish } from 'duoyun-ui/lib/types';
import { paramKeys, queryKeys } from 'src/constants';

import { locationStore, routes } from 'src/routes';
import { getAccount, getFriends, getGames, subscribeEvent } from 'src/services/api';
import { i18n } from 'src/i18n';
import { configure } from 'src/configure';

import 'src/modules/mt-nav';

type MtStore = { imgUrl: string; inertNav: boolean };
const mtAppStore = createStore<MtStore>({ imgUrl: '', inertNav: false });

export const updateMtApp = (data: Partial<MtStore>) => {
  updateStore(mtAppStore, data);
};

const style = createCSSSheet(css`
  :host {
    display: grid;
    grid-template:
      'nav' auto
      'page' 1fr;
    height: 100vh;
    min-height: auto;
  }
  .bg {
    position: absolute;
    inset: 0;
    object-fit: cover;
    z-index: -1;
    width: 100%;
    height: 100%;
    filter: blur(4em) brightness(0.3);
    image-rendering: pixelated;
  }
  m-mt-nav {
    grid-area: nav;
  }
`);

/**
 * @customElement mt-app-root
 */
@customElement('mt-app-root')
@adoptedStyle(style)
@connectStore(mtAppStore)
@connectStore(configure)
export class MTAppRootElement extends GemElement {
  #onLoading = () => {
    Loadbar.start();
  };

  #onChange = async () => {
    Loadbar.end();
  };

  #enterRoom = () => {
    const rid = configure.user?.playing?.id;
    if (rid) {
      history.replace({
        path: createPath(routes.room, { params: { [paramKeys.ROOM_ID]: String(rid) } }),
        query: new QueryString({ [queryKeys.ROOM_FROM]: history.getParams().path + history.getParams().query }),
      });
    }
  };

  #onClick = () => {
    const gamepads = navigator
      .getGamepads()
      .filter(isNotNullish)
      .filter((e) => e.connected);
    if (!gamepads.length) {
      Toast.open('warning', 'Please connect the gamepad');
    }
  };

  mounted = () => {
    this.effect(this.#enterRoom, () => [configure.user?.playing?.id]);
    this.effect(
      () => forever(getGames),
      () => [i18n.currentLanguage],
    );
    forever(getAccount);
    forever(getFriends);
    const subscription = subscribeEvent();
    addEventListener('click', this.#onClick);
    return () => {
      removeEventListener('click', this.#onClick);
      subscription.return?.();
    };
  };

  render = () => {
    return html`
      <img class="bg" src=${mtAppStore.imgUrl} />
      <m-mt-nav ?inert=${mtAppStore.inertNav}></m-mt-nav>
      <dy-route
        @loading=${this.#onLoading}
        @routechange=${this.#onChange}
        .routes=${routes}
        .locationStore=${locationStore}
      ></dy-route>
    `;
  };
}
