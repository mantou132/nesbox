import { history, QueryString } from '@mantou/gem';
import { createPath } from 'duoyun-ui/elements/route';
import { matchRoute } from 'src/utils';
import { routes } from 'src/routes';

import { queryKeys } from 'src/constants';
import { deleteUser, Profile } from 'src/configure';

export const gotoRedirectUri = () => {
  const url = history.getParams().query.get(queryKeys.REDIRECT_URI);
  try {
    const { pathname, search } = new URL(String(url));
    history.replace({ path: pathname, query: search });
  } catch {
    history.replace({ path: createPath(routes.games) });
  }
};

export const logout = () => {
  if (matchRoute(routes.login)) return;
  deleteUser();
  history.replace({
    path: createPath(routes.login),
    query: new QueryString({ [queryKeys.REDIRECT_URI]: window.location.href }),
  });
};

export const isExpiredProfile = (profile: Profile) => {
  return profile.exp - 5 < Date.now() / 1000;
};
