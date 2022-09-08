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
} from '@mantou/gem';
import { createPath } from 'duoyun-ui/elements/route';
import { forever } from 'duoyun-ui/lib/utils';

import { routes } from 'src/routes';
import { getAccount, getFriends, getGames, subscribeEvent } from 'src/services/api';
import { i18n } from 'src/i18n';
import { configure } from 'src/configure';
import { paramKeys } from 'src/constants';

import 'src/modules/mt-nav';

type MtStore = { imgUrl: string };
const mtAppStore = createStore<MtStore>({ imgUrl: '' });

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
  }
  .bg {
    position: absolute;
    inset: 0;
    object-fit: cover;
    z-index: 0;
    width: 100%;
    height: 100%;
    filter: blur(5em) brightness(0.6);
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
  #enterRoom = () => {
    const rid = configure.user?.playing?.id;
    if (rid) {
      history.replace({
        path: createPath(routes.room, { params: { [paramKeys.ROOM_ID]: String(rid) } }),
      });
    }
  };

  mounted = () => {
    this.effect(this.#enterRoom, () => [configure.user?.playing?.id, history.getParams().path]);
    this.effect(
      () => forever(getGames),
      () => [i18n.currentLanguage],
    );
    forever(getAccount);
    forever(getFriends);
    const subscription = subscribeEvent();
    return () => {
      subscription.return?.();
    };
  };

  render = () => {
    return html`
      <img class="bg" src=${mtAppStore.imgUrl} />
      <m-mt-nav></m-mt-nav>
      <dy-route .routes=${routes}></dy-route>
    `;
  };
}
