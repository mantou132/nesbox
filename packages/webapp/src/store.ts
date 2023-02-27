import { ElementOf } from 'duoyun-ui/lib/types';
import { createCacheStore } from 'duoyun-ui/lib/utils';
import { updateStore } from '@mantou/gem';
import { localStorageKeys } from 'src/constants';

import {
  GetCommentsQuery,
  GetFriendsQuery,
  GetGamesQuery,
  GetRoomsQuery,
  GetMessagesQuery,
  EventSubscription,
  EnterLobbyMutation,
} from 'src/generated/graphql';
import { configure } from 'src/configure';

export type Game = ElementOf<GetGamesQuery['games']>;
export type Room = ElementOf<GetRoomsQuery['rooms']>;
export type Invite = ElementOf<GetFriendsQuery['invites']>;
export type Friend = ElementOf<GetFriendsQuery['friends']>;
export type Comment = ElementOf<GetCommentsQuery['comments']>;
export type GameRecord = GetCommentsQuery['record'];
export type Message = ElementOf<GetMessagesQuery['messages']>;
export type LobbyInfo = EnterLobbyMutation['enterLobby'];
export type LobbyMessage = Exclude<EventSubscription['event']['lobbyMessage'], undefined>;

interface Store {
  games: Record<number, Game | undefined>;
  gameIds?: number[];
  comment: Record<
    number, // gameId
    | {
        comments: Record<number /**userId */, Comment | undefined>;
        userIds?: number[];
      }
    | undefined
  >;
  record: Record<number, GameRecord | undefined>;
  topGameIds?: number[];
  favoriteIds?: number[];
  recentGameIds?: number[];
  rooms: Record<number, Room | undefined>;
  roomIds?: number[];
  lobbyInfo?: LobbyInfo;
  lobbyMessage: LobbyMessage[];
}

export const [store] = createCacheStore<Store>(
  localStorageKeys.STORE_LOCAL_STORAGE_KEY,
  {
    games: {},
    comment: {},
    rooms: {},
    record: {},
    lobbyMessage: [],
  },
  {
    prefix: () => configure.user?.username,
    depStore: configure,
    cacheExcludeKeys: ['roomIds', 'rooms', 'lobbyMessage'],
  },
);

export function clearLobbyMessage() {
  updateStore(store, { lobbyMessage: [] });
}

interface FriendStore {
  draft: Record<number, string | undefined>;
  messages: Record<number, Message | undefined>;
  messageIds: Record<number, number[] | undefined>;
  invites: Record<number, Invite | undefined>;
  inviteIds?: number[];
  friends: Record<number, Friend | undefined>;
  friendIds?: number[];
  recentFriendChat?: number;
  friendChatState?: number;
}

export const [friendStore] = createCacheStore<FriendStore>(
  localStorageKeys.FRIEND_CHAT_STORAGE_KEY,
  {
    draft: {},
    messageIds: {},
    messages: {},
    invites: {},
    friends: {},
  },
  {
    prefix: () => configure.user?.username,
    depStore: configure,
  },
);

export function changeFriendChatDraft(friendId: number, body?: string) {
  updateStore(friendStore, { draft: { ...friendStore.draft, [friendId]: body } });
}

export const toggleFriendChatState = async (id?: number) => {
  if (id && id === friendStore.friendChatState) {
    // re-focus on friend chat
    updateStore(friendStore, { friendChatState: undefined });
    await Promise.resolve();
  }
  updateStore(friendStore, {
    recentFriendChat: id || friendStore.friendChatState || friendStore.recentFriendChat,
    friendChatState: id,
  });
};
