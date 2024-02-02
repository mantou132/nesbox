import { b64ToUtf8 } from 'duoyun-ui/lib/encode';
import { debounce } from 'duoyun-ui/lib/timer';
import { isNotNullish } from 'duoyun-ui/lib/types';

import { request } from 'src/services';
import {
  Login,
  LoginMutation,
  LoginMutationVariables,
  Register,
  RegisterMutation,
  RegisterMutationVariables,
  ScLoginReq,
  GetComments,
  GetCommentsQuery,
  GetCommentsQueryVariables,
  GetGames,
  GetGamesQuery,
  GetGamesQueryVariables,
  GetRooms,
  GetRoomsQuery,
  GetRoomsQueryVariables,
  ScRegisterReq,
} from 'src/generated/guestgraphql';
import { updateConfigureStore, parseAccount } from 'src/configure';
import { store, updateStore, convertGame } from 'src/store';
import { isCurrentLang } from 'src/i18n/basic';

export const GUEST_ENDPOINT = '/guestgraphql';

function setUser(resp: LoginMutation['login']) {
  const tokenParsed = JSON.parse(b64ToUtf8(resp.token.split('.')[1]));
  updateConfigureStore({
    user: parseAccount(resp.user),
    profile: {
      token: resp.token,
      exp: tokenParsed.exp,
      nickname: tokenParsed.nickname,
      username: tokenParsed.preferred_username,
    },
  });
}

const options = {
  endpoint: GUEST_ENDPOINT,
  skipAuth: true,
};

export const login = async (input: ScLoginReq) => {
  const { login } = await request<LoginMutation, LoginMutationVariables>(Login, { input }, options);
  setUser(login);
};

export const register = async (input: ScRegisterReq) => {
  const { register } = await request<RegisterMutation, RegisterMutationVariables>(Register, { input }, options);
  setUser(register);
};

export const getGames = debounce(async () => {
  const { games, topGames } = await request<GetGamesQuery, GetGamesQueryVariables>(GetGames, {}, options);
  const gameIds = games
    .map((e) => {
      store.games[e.id] = convertGame(e);
      if (isCurrentLang(e)) return e.id;
    })
    .filter(isNotNullish);
  updateStore({
    gameIds,
    topGameIds: [...new Set([...topGames, ...gameIds])].filter((id) => isCurrentLang(store.games[id]!)).splice(0, 5),
  });
});

export const getRooms = async () => {
  const { rooms } = await request<GetRoomsQuery, GetRoomsQueryVariables>(GetRooms, {}, options);
  if (!store.gameIds?.length) await getGames();
  updateStore({
    roomIds: rooms
      .filter(({ gameId }) => gameId in store.games && isCurrentLang(store.games[gameId]!))
      .map((e) => {
        store.rooms[e.id] = e;
        return e.id;
      }),
  });
};

export const getComments = async (gameId: number) => {
  const { comments } = await request<GetCommentsQuery, GetCommentsQueryVariables>(GetComments, { gameId }, options);
  store.comment[gameId] = {
    userIds: comments.map((e) => e.user.id),
    comments: Object.fromEntries(comments.map((e) => [e.user.id, e])),
  };
  updateStore();
};
