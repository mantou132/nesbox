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
  hello: Scalars['String'];
};

export type ScLoginReq = {
  password: Scalars['String'];
  username: Scalars['String'];
};

export type ScLoginResp = {
  __typename?: 'ScLoginResp';
  token: Scalars['String'];
  user: ScUser;
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

export type ScRoomBasicPartFragment = { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number };

export type ScAccountPartFragment = { __typename?: 'ScUser', id: number, username: string, nickname: string, settings?: string, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } };

export type LoginMutationVariables = Exact<{
  input: ScLoginReq;
}>;


export type LoginMutation = { __typename?: 'GuestMutationRoot', login: { __typename?: 'ScLoginResp', token: string, user: { __typename?: 'ScUser', id: number, username: string, nickname: string, settings?: string, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } } };

export type RegisterMutationVariables = Exact<{
  input: ScLoginReq;
}>;


export type RegisterMutation = { __typename?: 'GuestMutationRoot', register: { __typename?: 'ScLoginResp', token: string, user: { __typename?: 'ScUser', id: number, username: string, nickname: string, settings?: string, playing?: { __typename?: 'ScRoomBasic', id: number, gameId: number, private: boolean, host: number, createdAt: number, updatedAt: number } } } };

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