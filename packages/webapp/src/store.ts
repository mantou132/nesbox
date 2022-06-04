import { ElementOf } from 'duoyun-ui/lib/types';
import { createCacheStore } from 'duoyun-ui/lib/utils';

import {
  GetCommentsQuery,
  GetFriendsQuery,
  GetGamesQuery,
  GetRoomsQuery,
  GetMessagesQuery,
} from 'src/generated/graphql';
import { localStorageKeys } from 'src/constants';
import { configure } from 'src/configure';

export type Game = ElementOf<GetGamesQuery['games']>;
export type Room = ElementOf<GetRoomsQuery['rooms']>;
export type Invite = ElementOf<GetFriendsQuery['invites']>;
export type Friend = ElementOf<GetFriendsQuery['friends']>;
export type Comment = ElementOf<GetCommentsQuery['comments']>;
export type Message = ElementOf<GetMessagesQuery['messages']>;

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
  topGameIds?: number[];
  favoriteIds?: number[];
  rooms: Record<number, Room | undefined>;
  roomIds?: number[];
}

export const [store] = createCacheStore<Store>(
  localStorageKeys.STORE_LOCAL_STORAGE_KEY,
  {
    games: {},
    comment: {},
    rooms: {},
  },
  {
    prefix: configure.user!.username,
  },
);

interface FriendStore {
  draft: Record<number, string | undefined>;
  messages: Record<number, Message | undefined>;
  messageIds: Record<number, number[] | undefined>;
  invites: Record<number, Invite | undefined>;
  inviteIds?: number[];
  friends: Record<number, Friend | undefined>;
  friendIds?: number[];
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
  { prefix: configure.user!.username },
);
