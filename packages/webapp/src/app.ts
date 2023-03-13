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
  QueryString,
} from '@mantou/gem';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { Loadbar } from 'duoyun-ui/elements/page-loadbar';
import { createPath } from '@mantou/gem/elements/route';
import { forever } from 'duoyun-ui/lib/utils';
import { preventDefault } from 'src/utils';
import { routes, locationStore } from 'src/routes';

import { paramKeys, queryKeys, viewTransitionName } from 'src/constants';
import {
  configure,
  getShortcut,
  toggleFriendListState,
  setSearchCommand,
  toggleSearchState,
  toggleSettingsState,
  SearchCommand,
} from 'src/configure';
import { enterPubRoom, getAccount, getFriends, getGames, subscribeEvent } from 'src/services/api';
import { i18n } from 'src/i18n';
import { clearLobbyMessage, friendStore, toggleFriendChatState } from 'src/store';
import { ScFriendStatus } from 'src/generated/graphql';

import 'duoyun-ui/elements/input-capture';
import 'duoyun-ui/elements/drawer';
import 'duoyun-ui/elements/route';
import 'duoyun-ui/elements/modal';
import 'src/modules/settings';
import 'src/modules/search';
import 'src/modules/friend-list';
import 'src/modules/chat';
import 'src/modules/nav';

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
    view-transition-name: ${viewTransitionName.MAIN};
    outline: none;
  }
  .content::-webkit-scrollbar {
    width: 0;
  }
`);

/**
 * @customElement app-root
 */
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

  mounted = () => {
    if (this.#joinRoom) {
      history.replace({ ...history.getParams(), query: '' });
      enterPubRoom(this.#joinRoom);
    }

    this.effect(this.#enterRoom, () => [configure.user?.playing?.id]);
    this.effect(
      () => {
        clearLobbyMessage();
        return forever(getGames);
      },
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
      <div tabindex="-1" class="content" ref=${this.contentRef.ref}>
        <main style="display: contents">
          <dy-route
            @loading=${this.#onLoading}
            @routechange=${this.#onChange}
            .routes=${routes}
            .locationStore=${locationStore}
            .transition=${!!configure.user?.settings.ui.viewTransition}
          >
            <div style="height: 100vh"></div>
          </dy-route>
          <div style="height: 3em"></div>
        </main>
      </div>

      <m-chat></m-chat>

      <dy-drawer
        customize
        .open=${!!configure.friendListState}
        @close=${toggleFriendListState}
        .body=${html`<m-friend-list style=${styleMap({ width: '15em' })}></m-friend-list>`}
      >
      </dy-drawer>

      <dy-modal
        .header=${i18n.get('setting')}
        .disableDefaultOKBtn=${true}
        .cancelText=${i18n.get('close')}
        .open=${!!configure.settingsState}
        @close=${toggleSettingsState}
      >
        <m-settings slot="body"></m-settings>
      </dy-modal>

      <dy-modal
        customize
        @close=${toggleSearchState}
        .maskCloseable=${true}
        .open=${!!configure.searchState}
        .body=${html`<m-search></m-search>`}
      >
      </dy-modal>

      ${configure.screencastMode ? html`<dy-input-capture></dy-input-capture>` : ''}
    `;
  };
}
