import { history, QueryString } from '@mantou/gem';
import { createPath } from 'duoyun-ui/elements/route';

import { deleteUser, Profile } from 'src/configure';
import { queryKeys } from 'src/constants';
import { routes } from 'src/routes';

export const gotoRedirectUri = () => {
  const url = history.getParams().query.get(queryKeys.REDIRECT_URI);
  try {
    const { pathname, search } = new URL(String(url));
    history.replace({ path: pathname, query: search });
  } catch {
    history.replace({ path: createPath(routes.home) });
  }
};

export const logout = (replaceState = false) => {
  deleteUser();
  const path = createPath(routes.login);
  const query = new QueryString({ [queryKeys.REDIRECT_URI]: window.location.href });
  if (replaceState) {
    history.replace({ path, query });
  } else {
    // reload store
    window.location.replace(`${path}${query}`);
  }
};

export const isExpiredProfile = (profile: Profile) => {
  return profile.exp - 5 < Date.now() / 1000;
};
