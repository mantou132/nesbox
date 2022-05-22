export type Maybe<T> = T;
export type InputMaybe<T> = T;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type MutationRoot = {
  __typename?: 'MutationRoot';
  acceptFriend: Scalars['String'];
  acceptInvite: Scalars['String'];
  applyFriend: ScFriend;
  createComment: ScComment;
  createGame: ScGame;
  createInvite: ScInvite;
  createMessage: ScMessage;
  createRoom: ScRoomBasic;
  enterPubRoom: Scalars['String'];
  favoriteGame: Scalars['String'];
  leaveRoom: Scalars['String'];
  signaling: Scalars['String'];
  updateAccount: ScUser;
  updateComment: ScComment;
  updateRoom: ScRoomBasic;
};


export type MutationRootAcceptFriendArgs = {
  input: ScUpdateFriend;
};


export type MutationRootAcceptInviteArgs = {
  input: ScUpdateInvite;
};


export type MutationRootApplyFriendArgs = {
  input: ScNewFriend;
};


export type MutationRootCreateCommentArgs = {
  input: ScNewComment;
};


export type MutationRootCreateGameArgs = {
  input: ScNewGame;
};


export type MutationRootCreateInviteArgs = {
  input: ScNewInvite;
};


export type MutationRootCreateMessageArgs = {
  input: ScNewMessage;
};


export type MutationRootCreateRoomArgs = {
  input: ScNewRoom;
};


export type MutationRootEnterPubRoomArgs = {
  input: ScUpdatePlaying;
};


export type MutationRootFavoriteGameArgs = {
  input: ScNewFavorite;
};


export type MutationRootLeaveRoomArgs = {
  input: ScUpdatePlaying;
};


export type MutationRootSignalingArgs = {
  input: ScNewSignal;
};


export type MutationRootUpdateAccountArgs = {
  input: ScUpdateUser;
};


export type MutationRootUpdateCommentArgs = {
  input: ScNewComment;
};


export type MutationRootUpdateRoomArgs = {
  input: ScUpdateRoom;
};

export type QueryRoot = {
  __typename?: 'QueryRoot';
  account: ScUser;
  comments: Array<ScComment>;
  favorites: Array<Scalars['Int']>;
  friends: Array<ScFriend>;
  games: Array<ScGame>;
  invites: Array<ScInvite>;
  messages: Array<ScMessage>;
  rooms: Array<ScRoom>;
  topGames: Array<Scalars['Int']>;
};


export type QueryRootCommentsArgs = {
  input: ScCommentsReq;
};


export type QueryRootMessagesArgs = {
  input: ScMessagesReq;
};

export type ScComment = {
  __typename?: 'ScComment';
  body: Scalars['String'];
  createdAt: Scalars['Float'];
  gameId: Scalars['Int'];
  like: Scalars['Boolean'];
  updatedAt: Scalars['Float'];
  user: ScUserBasic;
};

export type ScCommentsReq = {
  gameId: Scalars['Int'];
};

export type ScFriend = {
  __typename?: 'ScFriend';
  createdAt: Scalars['Float'];
  status: ScFriendStatus;
  user: ScUserBasic;
};

export enum ScFriendStatus {
  Accept = 'ACCEPT',
  Deny = 'DENY',
  Pending = 'PENDING'
}

export type ScGame = {
  __typename?: 'ScGame';
  createdAt: Scalars['Float'];
  description: Scalars['String'];
  id: Scalars['Int'];
  name: Scalars['String'];
  preview: Scalars['String'];
  rom: Scalars['String'];
  screenshots: Array<Scalars['String']>;
  updatedAt: Scalars['Float'];
};

export type ScInvite = {
  __typename?: 'ScInvite';
  createdAt: Scalars['Float'];
  id: Scalars['Int'];
  room: ScRoomBasic;
  targetId: Scalars['Int'];
  updatedAt: Scalars['Float'];
  userId: Scalars['Int'];
};

export type ScMessage = {
  __typename?: 'ScMessage';
  body: Scalars['String'];
  createdAt: Scalars['Float'];
  id: Scalars['Int'];
  targetId: Scalars['Int'];
  updatedAt: Scalars['Float'];
  userId: Scalars['Int'];
};

export type ScMessagesReq = {
  targetId: Scalars['Int'];
};

export type ScNewComment = {
  body: Scalars['String'];
  gameId: Scalars['Int'];
  like: Scalars['Boolean'];
};

export type ScNewFavorite = {
  favorite: Scalars['Boolean'];
  gameId: Scalars['Int'];
};

export type ScNewFriend = {
  targetId: Scalars['Int'];
};

export type ScNewGame = {
  description: Scalars['String'];
  name: Scalars['String'];
  preview: Scalars['String'];
  rom: Scalars['String'];
  screenshots: Array<Scalars['String']>;
};

export type ScNewInvite = {
  roomId: Scalars['Int'];
  targetId: Scalars['Int'];
};

export type ScNewMessage = {
  body: Scalars['String'];
  targetId: Scalars['Int'];
};

export type ScNewRoom = {
  gameId: Scalars['Int'];
  private: Scalars['Boolean'];
};

export type ScNewSignal = {
  json: Scalars['String'];
  targetId: Scalars['Int'];
};

export type ScNotifyMessage = {
  __typename?: 'ScNotifyMessage';
  acceptFriend?: Maybe<ScFriend>;
  applyFriend?: Maybe<ScFriend>;
  deleteFriend?: Maybe<Scalars['Int']>;
  deleteGame?: Maybe<Scalars['Int']>;
  deleteInvite?: Maybe<Scalars['Int']>;
  deleteRoom?: Maybe<Scalars['Int']>;
  newGame?: Maybe<ScGame>;
  newInvite?: Maybe<ScInvite>;
  newMessage?: Maybe<ScMessage>;
  sendSignal?: Maybe<ScSignal>;
  updateRoom?: Maybe<ScRoomBasic>;
  updateUser?: Maybe<ScUserBasic>;
};

export type ScRoom = {
  __typename?: 'ScRoom';
  createdAt: Scalars['Float'];
  gameId: Scalars['Int'];
  host: Scalars['Int'];
  id: Scalars['Int'];
  private: Scalars['Boolean'];
  updatedAt: Scalars['Float'];
  users: Array<ScUserBasic>;
};

export type ScRoomBasic = {
  __typename?: 'ScRoomBasic';
  createdAt: Scalars['Float'];
  gameId: Scalars['Int'];
  host: Scalars['Int'];
  id: Scalars['Int'];
  private: Scalars['Boolean'];
  updatedAt: Scalars['Float'];
};

export type ScSignal = {
  __typename?: 'ScSignal';
  json: Scalars['String'];
  userId: Scalars['Int'];
};

export type ScUpdateFriend = {
  accept: Scalars['Boolean'];
  targetId: Scalars['Int'];
};

export type ScUpdateInvite = {
  accept: Scalars['Boolean'];
  inviteId: Scalars['Int'];
};

export type ScUpdatePlaying = {
  roomId: Scalars['Int'];
};

export type ScUpdateRoom = {
  gameId: Scalars['Int'];
  host: Scalars['Int'];
  id: Scalars['Int'];
  private: Scalars['Boolean'];
};

export type ScUpdateUser = {
  nickname: Scalars['String'];
  settings?: InputMaybe<Scalars['String']>;
};

export type ScUser = {
  __typename?: 'ScUser';
  createdAt: Scalars['Float'];
  id: Scalars['Int'];
  nickname: Scalars['String'];
  playing?: Maybe<ScRoomBasic>;
  settings?: Maybe<Scalars['String']>;
  updatedAt: Scalars['Float'];
  username: Scalars['String'];
};

export type ScUserBasic = {
  __typename?: 'ScUserBasic';
  id: Scalars['Int'];
  nickname: Scalars['String'];
  playing?: Maybe<ScRoomBasic>;
  status: ScUserStatus;
  username: Scalars['String'];
};

export enum ScUserStatus {
  Offline = 'OFFLINE',
  Online = 'ONLINE'
}

export type Subscription = {
  __typename?: 'Subscription';
  event: ScNotifyMessage;
};

export type ScGamePartFragment = { __typename?: 'ScGame', id: number, name: string, description: string, preview: string, createdAt: number, updatedAt: number, rom: string, screenshots: Array<string> };

export type GetGamesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetGamesQuery = { __typename?: 'QueryRoot', games: Array<{ __typename?: 'ScGame', id: number, name: string, description: string, preview: string, createdAt: number, updatedAt: number, rom: string, screenshots: Array<string> }> };

export type EventSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type EventSubscription = { __typename?: 'Subscription', event: { __typename?: 'ScNotifyMessage', deleteGame?: number } };

export const ScGamePart = `
    fragment ScGamePart on ScGame {
  id
  name
  description
  preview
  createdAt
  updatedAt
  rom
  screenshots
}
    `;
export const GetGames = `
    query getGames {
  games {
    ...ScGamePart
  }
}
    ${ScGamePart}`;
export const Event = `
    subscription event {
  event {
    deleteGame
  }
}
    `;