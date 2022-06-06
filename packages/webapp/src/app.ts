import {
  GemElement,
  customElement,
  html,
  connectStore,
  css,
  createCSSSheet,
  adoptedStyle,
  history,
  styleMap,
} from '@mantou/gem';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { Loadbar } from 'duoyun-ui/elements/page-loadbar';
import { createPath } from '@mantou/gem/elements/route';
import { forever } from 'duoyun-ui/lib/utils';

import {
  configure,
  getShortcut,
  toggoleFriendListState,
  toggoleSearchState,
  toggoleSettingsState,
} from 'src/configure';
import { routes, locationStore } from 'src/routes';
import { getAccount, getFriends, getGames, subscribeEvent } from 'src/services/api';
import { paramKeys } from 'src/constants';
import { i18n } from 'src/i18n';

import 'duoyun-ui/elements/input-capture';
import 'duoyun-ui/elements/drawer';
import 'duoyun-ui/elements/route';
import 'duoyun-ui/elements/modal';
import 'src/modules/settings';
import 'src/modules/search';
import 'src/modules/friend-list';
import 'src/modules/chat';

const style = createCSSSheet(css``);

@customElement('app-root')
@connectStore(configure)
@adoptedStyle(style)
@connectStore(i18n.store)
@connectStore(history.store)
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
      [getShortcut('OPEN_SEARCH')]: toggoleSearchState,
      [getShortcut('OPEN_SETTINGS')]: toggoleSettingsState,
    })(evt);
  };

  #enterRoom = () => {
    const rid = configure.user?.playing?.id;
    if (rid) {
      history.replace({
        path: createPath(routes.room, { params: { [paramKeys.ROOM_ID]: String(rid) } }),
      });
    }
  };

  mounted = () => {
    this.effect(this.#enterRoom, () => [configure.user?.playing?.id]);
    this.effect(this.#enterRoom, () => [history.getParams().path]);
    forever(getAccount);
    forever(getGames).then(getFriends);
    addEventListener('keydown', this.#globalShortcut);
    const subscription = subscribeEvent();
    return () => {
      removeEventListener('keydown', this.#globalShortcut);
      subscription.return?.();
    };
  };

  render = () => {
    return html`
      <dy-route
        @loading=${this.#onLoading}
        @routechange=${this.#onChange}
        .routes=${routes}
        .locationStore=${locationStore}
      ></dy-route>

      <dy-drawer
        customize
        .open=${!!configure.friendListState}
        @close=${toggoleFriendListState}
        .body=${html`<m-friend-list style=${styleMap({ width: '15em' })}></m-friend-list>`}
      >
      </dy-drawer>

      ${configure.friendChatState ? html`<m-chat .friendId=${configure.friendChatState}></m-chat>` : ''}
      ${configure.screencastMode ? html`<dy-input-capture></dy-input-capture>` : ''}

      <dy-modal
        .header=${i18n.get('setting')}
        .disableDefualtOKBtn=${true}
        .cancelText=${i18n.get('close')}
        .open=${!!configure.settingsState}
        @close=${toggoleSettingsState}
      >
        <m-settings slot="body"></m-settings>
      </dy-modal>

      <dy-modal
        customize
        @close=${toggoleSearchState}
        .maskCloseable=${true}
        .open=${!!configure.searchState}
        .body=${html`<m-search></m-search>`}
      >
      </dy-modal>
    `;
  };
}
