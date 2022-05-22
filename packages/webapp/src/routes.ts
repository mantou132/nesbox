import { html, createStore, updateStore, connect } from '@mantou/gem';
import { GemRouteElement } from '@mantou/gem/elements/route';
import { ValueOf } from 'duoyun-ui/lib/types';

import { localStorageKeys } from 'src/constants';
import { i18n } from 'src/i18n';
import { logger } from 'src/logger';

import '@mantou/gem/elements/use';

// url data
export const locationStore = GemRouteElement.createLocationStore();

const getInitRoutes = () => {
  return {
    home: {
      title: '',
      pattern: '/',
      async getContent(_params: Record<string, string>) {
        return html``;
      },
    },
    login: {
      title: i18n.get('loginTitle'),
      pattern: '/login',
      async getContent(_params: Record<string, string>) {
        await import('src/pages/login');
        return html`<p-login></p-login>`;
      },
    },
    notfound: {
      title: i18n.get('notFoundTitle'),
      pattern: '*',
      async getContent(_params: Record<string, string>) {
        await import('src/pages/notfound');
        return html`<p-notfound></p-notfound>`;
      },
    },
  };
};

type Routes = ReturnType<typeof getInitRoutes>;
export type Route = ValueOf<Routes>;

let routesCache: Partial<Routes> | undefined = undefined;
try {
  // 是否需要持久化储存？
  // routesCache = JSON.parse(localStorage.getItem(localStorageKeys.ROUTES_LOCAL_STORAGE_KEY) || '{}');
  routesCache = {};
} catch (err) {
  logger.warn(err);
}

export const routes = createStore(
  Object.fromEntries(
    Object.entries(getInitRoutes()).map(([routeName, route]) => [
      routeName,
      // only restore `query` field
      Object.assign({}, routesCache?.[routeName as keyof Routes], route),
    ]),
  ) as Routes,
);
window.addEventListener('pagehide', () => {
  localStorage.setItem(localStorageKeys.ROUTES_LOCAL_STORAGE_KEY, JSON.stringify(routes));
});

connect(i18n.store, () => {
  Object.entries(getInitRoutes()).forEach(([routeName, route]) => {
    routes[routeName as keyof Routes].title = route.title;
  });
  updateStore(routes);
});
