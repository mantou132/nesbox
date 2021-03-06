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
  refobject,
  RefObject,
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
import { enterPubRoom, getAccount, getFriends, getGames, subscribeEvent } from 'src/services/api';
import { paramKeys, queryKeys } from 'src/constants';
import { i18n } from 'src/i18n';
import { preventDefault } from 'src/utils';

import 'duoyun-ui/elements/input-capture';
import 'duoyun-ui/elements/drawer';
import 'duoyun-ui/elements/route';
import 'duoyun-ui/elements/modal';
import 'src/modules/settings';
import 'src/modules/search';
import 'src/modules/friend-list';
import 'src/modules/chat';
import 'src/modules/nav';
import 'src/modules/footer';

const style = createCSSSheet(css`
  :host {
    position: relative;
    height: 0;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  .content {
    height: 0;
    flex-grow: 1;
    display: block;
    overflow-y: auto;
    scrollbar-width: none;
  }
  .content::-webkit-scrollbar {
    width: 0;
  }
`);

@customElement('app-root')
@connectStore(configure)
@adoptedStyle(style)
@connectStore(i18n.store)
@connectStore(history.store)
export class AppRootElement extends GemElement {
  @refobject contentRef: RefObject<HTMLDivElement>;

  get #joinRoom() {
    return Number(history.getParams().query.get(queryKeys.JOIN_ROOM));
  }

  #onLoading = () => {
    Loadbar.start();
  };

  #onChange = async () => {
    Loadbar.end();
    this.contentRef.element?.scrollTo(0, 0);
  };

  #globalShortcut = (evt: KeyboardEvent) => {
    hotkeys({
      [getShortcut('OPEN_SEARCH')]: preventDefault(toggoleSearchState),
      [getShortcut('OPEN_SETTINGS')]: preventDefault(toggoleSettingsState),
    })(evt);
  };

  #stopPropagation = (e: DragEvent) => e.stopPropagation();

  #enterRoom = () => {
    const rid = configure.user?.playing?.id;
    if (rid) {
      history.replace({
        path: createPath(routes.room, { params: { [paramKeys.ROOM_ID]: String(rid) } }),
      });

      this.addEventListener('dragover', this.#stopPropagation);
      return () => this.removeEventListener('dragover', this.#stopPropagation);
    }
  };

  mounted = () => {
    if (this.#joinRoom) {
      history.replace({ ...history.getParams(), query: '' });
      enterPubRoom(this.#joinRoom);
    }

    this.effect(this.#enterRoom, () => [configure.user?.playing?.id, history.getParams().path]);
    this.effect(
      () => forever(getGames),
      () => [i18n.currentLanguage],
    );
    forever(getAccount);
    forever(getFriends);
    addEventListener('keydown', this.#globalShortcut);
    const subscription = subscribeEvent();
    return () => {
      removeEventListener('keydown', this.#globalShortcut);
      subscription.return?.();
    };
  };

  render = () => {
    return html`
      <m-nav></m-nav>
      <div class="content" ref=${this.contentRef.ref}>
        <main style="display: centents">
          <dy-route
            @loading=${this.#onLoading}
            @routechange=${this.#onChange}
            .routes=${routes}
            .locationStore=${locationStore}
          >
            <div style="height: 100vh"></div>
          </dy-route>
        </main>
        <m-footer></m-footer>
      </div>

      ${configure.friendChatState ? html`<m-chat .friendId=${configure.friendChatState}></m-chat>` : ''}

      <dy-drawer
        customize
        .open=${!!configure.friendListState}
        @close=${toggoleFriendListState}
        .body=${html`<m-friend-list style=${styleMap({ width: '15em' })}></m-friend-list>`}
      >
      </dy-drawer>

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

      ${configure.screencastMode ? html`<dy-input-capture></dy-input-capture>` : ''}
    `;
  };
}
