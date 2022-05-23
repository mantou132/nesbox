import { ElementOf } from 'duoyun-ui/lib/types';

import {
  GetCommentsQuery,
  GetFriendsQuery,
  GetGamesQuery,
  GetMessagesQuery,
  GetRoomsQuery,
} from 'src/generated/graphql';
import { localStorageKeys } from 'src/constants';
import { configure } from 'src/configure';
import { createCacheStore } from 'src/utils';

export type Game = ElementOf<GetGamesQuery['games']>;
export type Message = ElementOf<GetMessagesQuery['messages']>;
export type Room = ElementOf<GetRoomsQuery['rooms']>;
export type Invite = ElementOf<GetFriendsQuery['invites']>;
export type Friend = ElementOf<GetFriendsQuery['friends']>;
export type Comment = ElementOf<GetCommentsQuery['comments']>;

interface Store {
  games: Record<number, Game | undefined>;
  gameIds?: number[];
  comment: Record<
    number,
    {
      comments: Record<number, Comment | undefined>;
      userIds?: number[];
    }
  >;
  topGameIds?: number[];
  favoriteIds?: number[];
  messages: Record<number, Message | undefined>;
  messageIds: Record<number, number[] | undefined>;
  rooms: Record<number, Room | undefined>;
  roomIds?: number[];
  invites: Record<number, Invite | undefined>;
  inviteIds?: number[];
  friends: Record<number, Friend | undefined>;
  friendIds?: number[];
}

export const [store] = createCacheStore<Store>(
  localStorageKeys.STORE_LOCAL_STORAGE_KEY,
  {
    games: {},
    comment: {},
    messages: {},
    messageIds: {},
    rooms: {},
    invites: {},
    friends: {},
  },
  {
    prefix: configure.profile!.username,
  },
);
