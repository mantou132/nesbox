import {
  addListener,
  adoptedStyle,
  classMap,
  connectStore,
  createRef,
  css,
  customElement,
  effect,
  GemElement,
  history,
  html,
  mounted,
  QueryString,
  styleMap,
} from '@mantou/gem';
import { createPath } from '@mantou/gem/elements/route';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { Loadbar } from 'duoyun-ui/elements/page-loadbar';
import type { DuoyunRouteElement } from 'duoyun-ui/elements/route';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import {
  configure,
  getShortcut,
  SearchCommand,
  setSearchCommand,
  toggleFriendListState,
  toggleSearchState,
  toggleSettingsState,
} from 'src/configure';
import { paramKeys, queryKeys, viewTransitionName } from 'src/constants';
import { ScFriendStatus } from 'src/generated/graphql';
import { i18n } from 'src/i18n/basic';
import { locationStore, routes } from 'src/routes';
import { enterPubRoom, getAccount, getFriends, getGameIds, subscribeEvent } from 'src/services/api';
import { getGames } from 'src/services/guest-api';
import { clearLobbyMessage, friendStore, toggleFriendChatState } from 'src/store';
import { theme } from 'src/theme';
import { preventDefault } from 'src/utils/common';

import 'duoyun-ui/elements/drawer';
import 'duoyun-ui/elements/input-capture';
import 'duoyun-ui/elements/modal';
import 'src/modules/chat';
import 'src/modules/friend-list';
import 'src/modules/nav';
import 'src/modules/search';
import 'src/modules/settings';
import 'src/modules/side-nav';

const style = css`
  :scope {
    display: contents;
  }
  .app {
    position: relative;
    height: 0;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    background-color: ${theme.backgroundColor};
    transition: all 0.3s ${theme.timingEasingFunction};
    transform-origin: left center;
  }
  .app.out {
    transform: translateX(80vw) scale(0.9);
    border-radius: 0.5em;
    overflow: hidden;
  }
  .content {
    position: relative;
    height: 0;
    flex-grow: 1;
    display: block;
    overflow-y: auto;
    scrollbar-width: none;
    view-transition-name: ${viewTransitionName.MAIN};
    outline: none;
  }
  .content::-webkit-scrollbar {
    width: 0;
  }
`;

@customElement('app-root')
@connectStore(configure)
@adoptedStyle(style)
@connectStore(history.store)
export class AppRootElement extends GemElement {
  contentRef = createRef<HTMLDivElement>();

  #routeRef = createRef<DuoyunRouteElement>();
  #scrollPosition = new Map<string, number>();

  get #joinRoom() {
    return Number(history.getParams().query.get(queryKeys.JOIN_ROOM));
  }

  #onLoading = () => {
    Loadbar.start();
    const { currentRoute, currentParams } = this.#routeRef.value!;
    if (currentRoute) {
      const scrollTop = this.contentRef.value?.scrollTop || 0;
      this.#scrollPosition.set(createPath(currentRoute, { params: currentParams }), scrollTop > 360 ? scrollTop : 0);
    }
  };

  #onChange = async () => {
    Loadbar.end();
    // await render
    await Promise.resolve();
    this.contentRef.value?.scrollTo(0, this.#scrollPosition.get(locationStore.path) || 0);
  };

  #openUnReadMessage = () => {
    const hasUnreadMsgUserId = friendStore.friendIds?.find((id) => friendStore.friends[id]?.unreadMessageCount);
    if (hasUnreadMsgUserId) {
      toggleFriendChatState(hasUnreadMsgUserId);
    } else if (
      (friendStore.friendIds?.some((id) => friendStore.friends[id]?.status === ScFriendStatus.Pending) ||
        friendStore.inviteIds?.length) &&
      !configure.friendListState
    ) {
      toggleFriendListState();
    } else {
      toggleFriendChatState(friendStore.recentFriendChat);
    }
  };

  #globalShortcut = (evt: KeyboardEvent) => {
    hotkeys({
      [getShortcut('OPEN_SEARCH')]: preventDefault(toggleSearchState),
      [getShortcut('OPEN_HELP')]: preventDefault(() => setSearchCommand(SearchCommand.HELP)),
      [getShortcut('OPEN_SETTINGS')]: preventDefault(() => {
        if (friendStore.friendChatState) {
          toggleFriendChatState();
        } else {
          toggleSettingsState();
        }
      }),
      [getShortcut('QUICK_REPLY')]: preventDefault(this.#openUnReadMessage),
    })(evt);
  };

  #stopPropagation = (e: DragEvent) => e.stopPropagation();

  @effect(() => [configure.user?.playing?.id])
  #enterRoom = () => {
    const rid = configure.user?.playing?.id;
    if (rid) {
      history.replace({
        path: createPath(routes.room, { params: { [paramKeys.ROOM_ID]: String(rid) } }),
        query: new QueryString({ [queryKeys.ROOM_FROM]: history.getParams().path }),
      });

      this.addEventListener('dragover', this.#stopPropagation);
      return () => this.removeEventListener('dragover', this.#stopPropagation);
    }
  };

  @mounted()
  #init = () => {
    if (this.#joinRoom) {
      history.replace({ ...history.getParams(), query: '' });
      enterPubRoom(this.#joinRoom);
    }
    return addListener(document, 'keydown', this.#globalShortcut);
  };

  @effect(() => [i18n.currentLanguage])
  #resetPosition = (_: any, prev: any) => {
    this.#scrollPosition.clear();
    this.contentRef.value?.scrollTo(0, 0);
    clearLobbyMessage();
    getGames();
    if (prev && configure.user) {
      getGameIds();
    }
  };

  @effect(() => [configure.user?.id])
  #refresh = () => {
    if (configure.user) {
      getGameIds();
      getAccount();
      getFriends();
      const subscription = subscribeEvent();
      return () => subscription.return?.();
    }
  };

  render = () => {
    return html`
      <m-side-nav v-if=${mediaQuery.isPhone} ?open=${configure.sideNavState}></m-side-nav>
      <div class=${classMap({ app: true, out: !!configure.sideNavState })}>
        <m-nav></m-nav>
        <div ${this.contentRef} tabindex="-1" class="content" ?inert=${configure.sideNavState} >
          <main style="display: contents">
            <dy-light-route
              ${this.#routeRef}
              @loading=${this.#onLoading}
              @routechange=${this.#onChange}
              .routes=${routes}
              .locationStore=${locationStore}
              .transition=${!!configure.user?.settings.ui.viewTransition && !mediaQuery.isPhone}
            ></dy-light-route>
            <div style="height: 3em"></div>
          </main>
        </div>
      </div>

      <m-chat></m-chat>

      <dy-drawer
        @close=${toggleFriendListState}
        .customize=${true}
        .open=${!!configure.friendListState}
        .bodySlot=${html`<m-friend-list style=${styleMap({ width: '15em' })}></m-friend-list>`}
      >
      </dy-drawer>

      <dy-modal
        .header=${i18n.get('settings.title')}
        .disableDefaultOKBtn=${true}
        .cancelText=${i18n.get('global.close')}
        .open=${!!configure.settingsState}
        @close=${toggleSettingsState}
      >
        <m-settings></m-settings>
      </dy-modal>

      <dy-modal
        @close=${toggleSearchState}
        .customize=${true}
        .maskClosable=${true}
        .open=${!!configure.searchState}
        .bodySlot=${html`<m-search></m-search>`}
      >
      </dy-modal>

      <dy-input-capture v-if=${!!configure.screencastMode}></dy-input-capture>
    `;
  };
}
