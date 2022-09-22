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
  applyFriend: Scalars['String'];
  createComment: ScComment;
  createGame: ScGame;
  createInvite: Scalars['String'];
  createMessage: ScMessage;
  createRoom: ScRoomBasic;
  enterPubRoom: ScRoomBasic;
  favoriteGame: Scalars['String'];
  leaveRoom: Scalars['String'];
  readMessage: ScFriend;
  signaling: Scalars['String'];
  updateAccount: ScUser;
  updatePassword: ScUser;
  updateRoom: ScRoomBasic;
  updateRoomScreenshot: ScRoomBasic;
  voiceMsg: Scalars['String'];
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


export type MutationRootReadMessageArgs = {
  input: ScReadMessage;
};


export type MutationRootSignalingArgs = {
  input: ScNewSignal;
};


export type MutationRootUpdateAccountArgs = {
  input: ScUpdateUser;
};


export type MutationRootUpdatePasswordArgs = {
  input: ScUpdatePassword;
};


export type MutationRootUpdateRoomArgs = {
  input: ScUpdateRoom;
};


export type MutationRootUpdateRoomScreenshotArgs = {
  input: ScUpdateRoomScreenshot;
};


export type MutationRootVoiceMsgArgs = {
  input: ScVoiceMsgReq;
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
  recentGames: Array<Scalars['Int']>;
  record?: Maybe<ScRecord>;
  rooms: Array<ScRoom>;
  topGames: Array<Scalars['Int']>;
};


export type QueryRootCommentsArgs = {
  input: ScCommentsReq;
};


export type QueryRootMessagesArgs = {
  input: ScMessagesReq;
};


export type QueryRootRecordArgs = {
  input: ScRecordReq;
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
  unreadMessageCount: Scalars['Int'];
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
  username: Scalars['String'];
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
  tryUsername?: InputMaybe<Scalars['String']>;
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
  deleteInvite?: Maybe<Scalars['Int']>;
  deleteRoom?: Maybe<Scalars['Int']>;
  login?: Maybe<Scalars['Boolean']>;
  newGame?: Maybe<ScGame>;
  newInvite?: Maybe<ScInvite>;
  newMessage?: Maybe<ScMessage>;
  sendSignal?: Maybe<ScSignal>;
  updateRoom?: Maybe<ScRoomBasic>;
  updateUser?: Maybe<ScUserBasic>;
  voiceSignal?: Maybe<ScVoiceSignal>;
};

export type ScReadMessage = {
  targetId: Scalars['Int'];
};

export type ScRecord = {
  __typename?: 'ScRecord';
  lastPlayEndAt?: Maybe<Scalars['Float']>;
  lastPlayStartAt: Scalars['Float'];
  playTotal: Scalars['Float'];
};

export type ScRecordReq = {
  gameId: Scalars['Int'];
};

export type ScRoom = {
  __typename?: 'ScRoom';
  createdAt: Scalars['Float'];
  gameId: Scalars['Int'];
  host: Scalars['Int'];
  id: Scalars['Int'];
  private: Scalars['Boolean'];
  screenshot?: Maybe<Scalars['String']>;
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

export type ScUpdatePassword = {
  oldpassword: Scalars['String'];
  password: Scalars['String'];
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

export type ScUpdateRoomScreenshot = {
  id: Scalars['Int'];
  screenshot: Scalars['String'];
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

export enum ScVoiceMsgKind {
  Answer = 'ANSWER',
  Ice = 'ICE',
  Offer = 'OFFER'
}

export type ScVoiceMsgReq = {
  json: Scalars['String'];
  kind: ScVoiceMsgKind;
};

export type ScVoiceSignal = {
  __typename?: 'ScVoiceSignal';
  json: Scalars['String'];
  roomId: Scalars['Int'];
};

export type Subscription = {
  __typename?: 'Subscription';
  event: ScNotifyMessage;
};

export type ScGamePartFragment = { __typename?: 'ScGame', id: number, name: string, description: string, preview: string, createdAt: number, updatedAt: number, rom: string, screenshots: Array<string> };

export type ScMessagePartFragment = { __typename?: 'ScMessage', id: number, body: string, targetId: number, userId: number, createdAt: number, updatedAt: number };

export type ScRoomBasicPartFragment = { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number };

export type ScInvitePartFragment = { __typename?: 'ScInvite', id: number, targetId: number, userId: number, createdAt: number, updatedAt: number, room: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } };

export type ScUserBasicPartFragment = { __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } };

export type ScAccountPartFragment = { __typename?: 'ScUser', id: number, username: string, nickname: string, settings?: string, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } };

export type ScRoomPartFragment = { __typename?: 'ScRoom', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number, screenshot?: string, users: Array<{ __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } }> };

export type ScCommentPartFragment = { __typename?: 'ScComment', gameId: number, body: string, like: boolean, createdAt: number, updatedAt: number, user: { __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } };

export type ScRecordPartFragment = { __typename?: 'ScRecord', playTotal: number, lastPlayStartAt: number, lastPlayEndAt?: number };

export type ScFriendPartFragment = { __typename?: 'ScFriend', createdAt: number, status: ScFriendStatus, unreadMessageCount: number, user: { __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } };

export type GetGamesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetGamesQuery = { __typename?: 'QueryRoot', topGames: Array<number>, favorites: Array<number>, recentGames: Array<number>, games: Array<{ __typename?: 'ScGame', id: number, name: string, description: string, preview: string, createdAt: number, updatedAt: number, rom: string, screenshots: Array<string> }> };

export type GetRoomsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRoomsQuery = { __typename?: 'QueryRoot', rooms: Array<{ __typename?: 'ScRoom', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number, screenshot?: string, users: Array<{ __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } }> }> };

export type GetCommentsQueryVariables = Exact<{
  gameId: Scalars['Int'];
}>;


export type GetCommentsQuery = { __typename?: 'QueryRoot', comments: Array<{ __typename?: 'ScComment', gameId: number, body: string, like: boolean, createdAt: number, updatedAt: number, user: { __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } }>, record?: { __typename?: 'ScRecord', playTotal: number, lastPlayStartAt: number, lastPlayEndAt?: number } };

export type GetFriendsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetFriendsQuery = { __typename?: 'QueryRoot', friends: Array<{ __typename?: 'ScFriend', createdAt: number, status: ScFriendStatus, unreadMessageCount: number, user: { __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } }>, invites: Array<{ __typename?: 'ScInvite', id: number, targetId: number, userId: number, createdAt: number, updatedAt: number, room: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } }> };

export type GetMessagesQueryVariables = Exact<{
  input: ScMessagesReq;
}>;


export type GetMessagesQuery = { __typename?: 'QueryRoot', messages: Array<{ __typename?: 'ScMessage', id: number, body: string, targetId: number, userId: number, createdAt: number, updatedAt: number }> };

export type GetAccountQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAccountQuery = { __typename?: 'QueryRoot', account: { __typename?: 'ScUser', id: number, username: string, nickname: string, settings?: string, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } };

export type SendVoiceMsgMutationVariables = Exact<{
  input: ScVoiceMsgReq;
}>;


export type SendVoiceMsgMutation = { __typename?: 'MutationRoot', voiceMsg: string };

export type SendSignalMutationVariables = Exact<{
  input: ScNewSignal;
}>;


export type SendSignalMutation = { __typename?: 'MutationRoot', signaling: string };

export type UpdateAccountMutationVariables = Exact<{
  input: ScUpdateUser;
}>;


export type UpdateAccountMutation = { __typename?: 'MutationRoot', updateAccount: { __typename?: 'ScUser', id: number, username: string, nickname: string, settings?: string, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } };

export type UpdatePasswordMutationVariables = Exact<{
  input: ScUpdatePassword;
}>;


export type UpdatePasswordMutation = { __typename?: 'MutationRoot', updatePassword: { __typename?: 'ScUser', id: number, username: string, nickname: string, settings?: string, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } };

export type CreateCommentMutationVariables = Exact<{
  input: ScNewComment;
}>;


export type CreateCommentMutation = { __typename?: 'MutationRoot', createComment: { __typename?: 'ScComment', gameId: number, body: string, like: boolean, createdAt: number, updatedAt: number, user: { __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } } };

export type CreateMessageMutationVariables = Exact<{
  input: ScNewMessage;
}>;


export type CreateMessageMutation = { __typename?: 'MutationRoot', createMessage: { __typename?: 'ScMessage', id: number, body: string, targetId: number, userId: number, createdAt: number, updatedAt: number } };

export type ReadMessageMutationVariables = Exact<{
  input: ScReadMessage;
}>;


export type ReadMessageMutation = { __typename?: 'MutationRoot', readMessage: { __typename?: 'ScFriend', createdAt: number, status: ScFriendStatus, unreadMessageCount: number, user: { __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } } };

export type FavoriteGameMutationVariables = Exact<{
  input: ScNewFavorite;
}>;


export type FavoriteGameMutation = { __typename?: 'MutationRoot', favoriteGame: string };

export type ApplyFriendMutationVariables = Exact<{
  input: ScNewFriend;
}>;


export type ApplyFriendMutation = { __typename?: 'MutationRoot', applyFriend: string };

export type AcceptFriendMutationVariables = Exact<{
  input: ScUpdateFriend;
}>;


export type AcceptFriendMutation = { __typename?: 'MutationRoot', acceptFriend: string };

export type CreateInviteMutationVariables = Exact<{
  input: ScNewInvite;
}>;


export type CreateInviteMutation = { __typename?: 'MutationRoot', createInvite: string };

export type AcceptInviteMutationVariables = Exact<{
  input: ScUpdateInvite;
}>;


export type AcceptInviteMutation = { __typename?: 'MutationRoot', acceptInvite: string };

export type CreateRoomMutationVariables = Exact<{
  input: ScNewRoom;
}>;


export type CreateRoomMutation = { __typename?: 'MutationRoot', createRoom: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } };

export type UpdateRoomMutationVariables = Exact<{
  input: ScUpdateRoom;
}>;


export type UpdateRoomMutation = { __typename?: 'MutationRoot', updateRoom: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } };

export type UpdateRoomScreenshotMutationVariables = Exact<{
  input: ScUpdateRoomScreenshot;
}>;


export type UpdateRoomScreenshotMutation = { __typename?: 'MutationRoot', updateRoomScreenshot: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } };

export type EnterPubRoomMutationVariables = Exact<{
  input: ScUpdatePlaying;
}>;


export type EnterPubRoomMutation = { __typename?: 'MutationRoot', enterPubRoom: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } };

export type LeaveRoomMutationVariables = Exact<{ [key: string]: never; }>;


export type LeaveRoomMutation = { __typename?: 'MutationRoot', leaveRoom: string };

export type EventSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type EventSubscription = { __typename?: 'Subscription', event: { __typename?: 'ScNotifyMessage', deleteRoom?: number, deleteInvite?: number, deleteFriend?: number, login?: boolean, newMessage?: { __typename?: 'ScMessage', id: number, body: string, targetId: number, userId: number, createdAt: number, updatedAt: number }, newGame?: { __typename?: 'ScGame', id: number, name: string, description: string, preview: string, createdAt: number, updatedAt: number, rom: string, screenshots: Array<string> }, updateRoom?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number }, newInvite?: { __typename?: 'ScInvite', id: number, targetId: number, userId: number, createdAt: number, updatedAt: number, room: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } }, applyFriend?: { __typename?: 'ScFriend', createdAt: number, status: ScFriendStatus, unreadMessageCount: number, user: { __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } }, acceptFriend?: { __typename?: 'ScFriend', createdAt: number, status: ScFriendStatus, unreadMessageCount: number, user: { __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } }, updateUser?: { __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } }, sendSignal?: { __typename?: 'ScSignal', userId: number, json: string }, voiceSignal?: { __typename?: 'ScVoiceSignal', roomId: number, json: string } } };

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
export const ScMessagePart = `
    fragment ScMessagePart on ScMessage {
  id
  body
  targetId
  userId
  createdAt
  updatedAt
}
    `;
export const ScRoomBasicPart = `
    fragment ScRoomBasicPart on ScRoomBasic {
  id
  gameId
  private
  host
  createdAt
  updatedAt
}
    `;
export const ScInvitePart = `
    fragment ScInvitePart on ScInvite {
  id
  room {
    ...ScRoomBasicPart
  }
  targetId
  userId
  createdAt
  updatedAt
}
    `;
export const ScAccountPart = `
    fragment ScAccountPart on ScUser {
  id
  username
  nickname
  settings
  playing {
    ...ScRoomBasicPart
  }
}
    `;
export const ScUserBasicPart = `
    fragment ScUserBasicPart on ScUserBasic {
  id
  username
  nickname
  status
  playing {
    ...ScRoomBasicPart
  }
}
    `;
export const ScRoomPart = `
    fragment ScRoomPart on ScRoom {
  id
  gameId
  private
  host
  createdAt
  updatedAt
  users {
    ...ScUserBasicPart
  }
  screenshot
}
    `;
export const ScCommentPart = `
    fragment ScCommentPart on ScComment {
  user {
    ...ScUserBasicPart
  }
  gameId
  body
  like
  createdAt
  updatedAt
}
    `;
export const ScRecordPart = `
    fragment ScRecordPart on ScRecord {
  playTotal
  lastPlayStartAt
  lastPlayEndAt
}
    `;
export const ScFriendPart = `
    fragment ScFriendPart on ScFriend {
  user {
    ...ScUserBasicPart
  }
  createdAt
  status
  unreadMessageCount
}
    `;
export const GetGames = `
    query getGames {
  games {
    ...ScGamePart
  }
  topGames
  favorites
  recentGames
}
    ${ScGamePart}`;
export const GetRooms = `
    query getRooms {
  rooms {
    ...ScRoomPart
  }
}
    ${ScRoomPart}
${ScUserBasicPart}
${ScRoomBasicPart}`;
export const GetComments = `
    query getComments($gameId: Int!) {
  comments(input: {gameId: $gameId}) {
    ...ScCommentPart
  }
  record(input: {gameId: $gameId}) {
    ...ScRecordPart
  }
}
    ${ScCommentPart}
${ScUserBasicPart}
${ScRoomBasicPart}
${ScRecordPart}`;
export const GetFriends = `
    query getFriends {
  friends {
    ...ScFriendPart
  }
  invites {
    ...ScInvitePart
  }
}
    ${ScFriendPart}
${ScUserBasicPart}
${ScRoomBasicPart}
${ScInvitePart}`;
export const GetMessages = `
    query getMessages($input: ScMessagesReq!) {
  messages(input: $input) {
    ...ScMessagePart
  }
}
    ${ScMessagePart}`;
export const GetAccount = `
    query getAccount {
  account {
    ...ScAccountPart
  }
}
    ${ScAccountPart}
${ScRoomBasicPart}`;
export const SendVoiceMsg = `
    mutation sendVoiceMsg($input: ScVoiceMsgReq!) {
  voiceMsg(input: $input)
}
    `;
export const SendSignal = `
    mutation sendSignal($input: ScNewSignal!) {
  signaling(input: $input)
}
    `;
export const UpdateAccount = `
    mutation updateAccount($input: ScUpdateUser!) {
  updateAccount(input: $input) {
    ...ScAccountPart
  }
}
    ${ScAccountPart}
${ScRoomBasicPart}`;
export const UpdatePassword = `
    mutation updatePassword($input: ScUpdatePassword!) {
  updatePassword(input: $input) {
    ...ScAccountPart
  }
}
    ${ScAccountPart}
${ScRoomBasicPart}`;
export const CreateComment = `
    mutation createComment($input: ScNewComment!) {
  createComment(input: $input) {
    ...ScCommentPart
  }
}
    ${ScCommentPart}
${ScUserBasicPart}
${ScRoomBasicPart}`;
export const CreateMessage = `
    mutation createMessage($input: ScNewMessage!) {
  createMessage(input: $input) {
    ...ScMessagePart
  }
}
    ${ScMessagePart}`;
export const ReadMessage = `
    mutation readMessage($input: ScReadMessage!) {
  readMessage(input: $input) {
    ...ScFriendPart
  }
}
    ${ScFriendPart}
${ScUserBasicPart}
${ScRoomBasicPart}`;
export const FavoriteGame = `
    mutation favoriteGame($input: ScNewFavorite!) {
  favoriteGame(input: $input)
}
    `;
export const ApplyFriend = `
    mutation applyFriend($input: ScNewFriend!) {
  applyFriend(input: $input)
}
    `;
export const AcceptFriend = `
    mutation acceptFriend($input: ScUpdateFriend!) {
  acceptFriend(input: $input)
}
    `;
export const CreateInvite = `
    mutation createInvite($input: ScNewInvite!) {
  createInvite(input: $input)
}
    `;
export const AcceptInvite = `
    mutation acceptInvite($input: ScUpdateInvite!) {
  acceptInvite(input: $input)
}
    `;
export const CreateRoom = `
    mutation createRoom($input: ScNewRoom!) {
  createRoom(input: $input) {
    ...ScRoomBasicPart
  }
}
    ${ScRoomBasicPart}`;
export const UpdateRoom = `
    mutation updateRoom($input: ScUpdateRoom!) {
  updateRoom(input: $input) {
    ...ScRoomBasicPart
  }
}
    ${ScRoomBasicPart}`;
export const UpdateRoomScreenshot = `
    mutation updateRoomScreenshot($input: ScUpdateRoomScreenshot!) {
  updateRoomScreenshot(input: $input) {
    ...ScRoomBasicPart
  }
}
    ${ScRoomBasicPart}`;
export const EnterPubRoom = `
    mutation enterPubRoom($input: ScUpdatePlaying!) {
  enterPubRoom(input: $input) {
    ...ScRoomBasicPart
  }
}
    ${ScRoomBasicPart}`;
export const LeaveRoom = `
    mutation leaveRoom {
  leaveRoom
}
    `;
export const Event = `
    subscription event {
  event {
    newMessage {
      ...ScMessagePart
    }
    newGame {
      ...ScGamePart
    }
    updateRoom {
      ...ScRoomBasicPart
    }
    deleteRoom
    newInvite {
      ...ScInvitePart
    }
    deleteInvite
    applyFriend {
      ...ScFriendPart
    }
    acceptFriend {
      ...ScFriendPart
    }
    deleteFriend
    updateUser {
      ...ScUserBasicPart
    }
    sendSignal {
      userId
      json
    }
    voiceSignal {
      roomId
      json
    }
    login
  }
}
    ${ScMessagePart}
${ScGamePart}
${ScRoomBasicPart}
${ScInvitePart}
${ScFriendPart}
${ScUserBasicPart}`;