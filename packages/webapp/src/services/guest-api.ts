import { updateStore } from '@mantou/gem';
import { b64ToUtf8 } from 'duoyun-ui/lib/encode';

import { request } from 'src/services';
import { Login, LoginMutation, LoginMutationVariables, ScLoginReq } from 'src/generated/guestgraphql';
import { configure } from 'src/configure';

export const GUEST_ENDPOINT = '/guestgraphql';

export const login = async (input: ScLoginReq) => {
  const { login } = await request<LoginMutation, LoginMutationVariables>(
    Login,
    { input },
    {
      endpoint: GUEST_ENDPOINT,
      skipAuth: true,
    },
  );
  const tokenParsed = JSON.parse(b64ToUtf8(login.token.split('.')[1]));
  updateStore(configure, {
    user: login.user,
    profile: {
      token: login.token,
      exp: tokenParsed.exp,
      nickname: tokenParsed.nickname,
      username: tokenParsed.preferred_username,
    },
  });
};
