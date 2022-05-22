import { GemElement, customElement, html, connectStore } from '@mantou/gem';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { Loadbar } from 'duoyun-ui/elements/page-loadbar';

import { configure, getShortcut } from 'src/configure';
import { routes, locationStore } from 'src/routes';
import { subscribeEvent } from 'src/services/api';

import 'duoyun-ui/elements/input-capture';
import '@mantou/gem/elements/route';

@customElement('app-root')
@connectStore(configure)
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
