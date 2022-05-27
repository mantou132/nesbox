import { updateStore } from '@mantou/gem';
import { b64ToUtf8 } from 'duoyun-ui/lib/encode';

import { request } from 'src/services';
import {
  Login,
  LoginMutation,
  LoginMutationVariables,
  Register,
  RegisterMutation,
  RegisterMutationVariables,
  ScLoginReq,
} from 'src/generated/guestgraphql';
import { configure, parseAccount } from 'src/configure';

export const GUEST_ENDPOINT = '/guestgraphql';

function setUser(resp: LoginMutation['login']) {
  const tokenParsed = JSON.parse(b64ToUtf8(resp.token.split('.')[1]));
  updateStore(configure, {
    user: parseAccount(resp.user),
    profile: {
      token: resp.token,
      exp: tokenParsed.exp,
      nickname: tokenParsed.nickname,
      username: tokenParsed.preferred_username,
    },
  });
}

export const login = async (input: ScLoginReq) => {
  const { login } = await request<LoginMutation, LoginMutationVariables>(
    Login,
    { input },
    {
      endpoint: GUEST_ENDPOINT,
      skipAuth: true,
    },
  );
  setUser(login);
};

export const register = async (input: ScLoginReq) => {
  const { register } = await request<RegisterMutation, RegisterMutationVariables>(
    Register,
    { input },
    {
      endpoint: GUEST_ENDPOINT,
      skipAuth: true,
    },
  );
  setUser(register);
};
