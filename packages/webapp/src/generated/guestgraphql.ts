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

export type GuestMutationRoot = {
  __typename?: 'GuestMutationRoot';
  login: ScLoginResp;
  register: ScLoginResp;
};


export type GuestMutationRootLoginArgs = {
  input: ScLoginReq;
};


export type GuestMutationRootRegisterArgs = {
  input: ScLoginReq;
};

export type GuestQueryRoot = {
  __typename?: 'GuestQueryRoot';
  comments: Array<ScComment>;
  games: Array<ScGame>;
  hello: Scalars['String'];
  rooms: Array<ScRoom>;
  topGames: Array<Scalars['Int']>;
};


export type GuestQueryRootCommentsArgs = {
  input: ScCommentsReq;
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

export type ScGame = {
  __typename?: 'ScGame';
  createdAt: Scalars['Float'];
  description: Scalars['String'];
  id: Scalars['Int'];
  kind?: Maybe<ScGameKind>;
  maxPlayer?: Maybe<Scalars['Int']>;
  name: Scalars['String'];
  platform?: Maybe<ScGamePlatform>;
  preview: Scalars['String'];
  rom: Scalars['String'];
  screenshots: Array<Scalars['String']>;
  series?: Maybe<ScGameSeries>;
  updatedAt: Scalars['Float'];
};

export enum ScGameKind {
  Act = 'ACT',
  Ftg = 'FTG',
  Other = 'OTHER',
  Pzg = 'PZG',
  Rcg = 'RCG',
  Rpg = 'RPG',
  Rts = 'RTS',
  Slg = 'SLG',
  Spg = 'SPG',
  Stg = 'STG',
  Tbg = 'TBG',
  Tbs = 'TBS'
}

export enum ScGamePlatform {
  Arcade = 'ARCADE',
  Nes = 'NES',
  UniversalJs = 'UNIVERSAL_JS',
  UniversalWasm = 'UNIVERSAL_WASM',
  Wasm4 = 'WASM4'
}

export enum ScGameSeries {
  AdventureIsland = 'ADVENTURE_ISLAND',
  Contra = 'CONTRA',
  DoubleDragon = 'DOUBLE_DRAGON',
  Kof = 'KOF',
  Mario = 'MARIO',
  MegaMan = 'MEGA_MAN',
  Nekketsu = 'NEKKETSU',
  NinjaGaiden = 'NINJA_GAIDEN',
  SanGokuShi = 'SAN_GOKU_SHI',
  StreetFighter = 'STREET_FIGHTER',
  Tank = 'TANK',
  Tmnt = 'TMNT'
}

export type ScLoginReq = {
  password: Scalars['String'];
  username: Scalars['String'];
};

export type ScLoginResp = {
  __typename?: 'ScLoginResp';
  token: Scalars['String'];
  user: ScUser;
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

export type ScRoomBasicPartFragment = { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number };

export type ScAccountPartFragment = { __typename?: 'ScUser', id: number, username: string, nickname: string, settings?: string, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } };

export type ScUserBasicPartFragment = { __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } };

export type ScRoomPartFragment = { __typename?: 'ScRoom', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number, screenshot?: string, users: Array<{ __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } }> };

export type ScGamePartFragment = { __typename?: 'ScGame', id: number, name: string, description: string, preview: string, createdAt: number, updatedAt: number, rom: string, screenshots: Array<string>, platform?: ScGamePlatform, kind?: ScGameKind, series?: ScGameSeries, maxPlayer?: number };

export type ScCommentPartFragment = { __typename?: 'ScComment', gameId: number, body: string, like: boolean, createdAt: number, updatedAt: number, user: { __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } };

export type LoginMutationVariables = Exact<{
  input: ScLoginReq;
}>;


export type LoginMutation = { __typename?: 'GuestMutationRoot', login: { __typename?: 'ScLoginResp', token: string, user: { __typename?: 'ScUser', id: number, username: string, nickname: string, settings?: string, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } } };

export type RegisterMutationVariables = Exact<{
  input: ScLoginReq;
}>;


export type RegisterMutation = { __typename?: 'GuestMutationRoot', register: { __typename?: 'ScLoginResp', token: string, user: { __typename?: 'ScUser', id: number, username: string, nickname: string, settings?: string, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } } };

export type GetGamesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetGamesQuery = { __typename?: 'GuestQueryRoot', topGames: Array<number>, games: Array<{ __typename?: 'ScGame', id: number, name: string, description: string, preview: string, createdAt: number, updatedAt: number, rom: string, screenshots: Array<string>, platform?: ScGamePlatform, kind?: ScGameKind, series?: ScGameSeries, maxPlayer?: number }> };

export type GetRoomsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetRoomsQuery = { __typename?: 'GuestQueryRoot', rooms: Array<{ __typename?: 'ScRoom', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number, screenshot?: string, users: Array<{ __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } }> }> };

export type GetCommentsQueryVariables = Exact<{
  gameId: Scalars['Int'];
}>;


export type GetCommentsQuery = { __typename?: 'GuestQueryRoot', comments: Array<{ __typename?: 'ScComment', gameId: number, body: string, like: boolean, createdAt: number, updatedAt: number, user: { __typename?: 'ScUserBasic', id: number, username: string, nickname: string, status: ScUserStatus, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } }> };

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
  platform
  kind
  series
  maxPlayer
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
export const Login = `
    mutation login($input: ScLoginReq!) {
  login(input: $input) {
    token
    user {
      ...ScAccountPart
    }
  }
}
    ${ScAccountPart}
${ScRoomBasicPart}`;
export const Register = `
    mutation register($input: ScLoginReq!) {
  register(input: $input) {
    token
    user {
      ...ScAccountPart
    }
  }
}
    ${ScAccountPart}
${ScRoomBasicPart}`;
export const GetGames = `
    query getGames {
  games {
    ...ScGamePart
  }
  topGames
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
}
    ${ScCommentPart}
${ScUserBasicPart}
${ScRoomBasicPart}`;