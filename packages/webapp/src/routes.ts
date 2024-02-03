import { html, connect, useStore } from '@mantou/gem';
import { GemRouteElement, RouteItem } from '@mantou/gem/elements/route';
import { ValueOf } from 'duoyun-ui/lib/types';
import { isMtApp } from '@nesbox/mtapp';

import { paramKeys } from 'src/constants';
import { i18n } from 'src/i18n/basic';

// url data
export const locationStore = GemRouteElement.createLocationStore();

const getInitRoutes = () => {
  return {
    download: {
      title: '',
      pattern: '/download',
      redirect: '/',
    },
    home: {
      title: '',
      pattern: '/',
      async getContent(_params: Record<string, string>) {
        await import('src/pages/homepage');
        return html`<p-homepage></p-homepage>`;
      },
    },
    games: {
      title: isMtApp ? undefined : i18n.get('page.games.title'),
      pattern: '/games',
      async getContent(_params: Record<string, string>) {
        if (isMtApp) {
          await import('src/pages/mt-games');
          return html`<p-mt-games></p-mt-games>`;
        }
        await import('src/pages/games');
        return html`<p-games></p-games>`;
      },
    },
    emulator: {
      title: i18n.get('page.emulator.title'),
      pattern: '/emulator',
      async getContent(_params: Record<string, string>) {
        await import('src/pages/emulator');
        return html`<p-emulator></p-emulator>`;
      },
    },
    privacy: {
      title: i18n.get('page.privacy.title'),
      pattern: '/privacy',
      async getContent(_params: Record<string, string>) {
        await import('src/pages/privacy');
        return html`<p-privacy></p-privacy>`;
      },
    },
    ramviewer: {
      title: i18n.get('page.ram.title'),
      pattern: '/ramviewer',
      async getContent(_params: Record<string, string>) {
        await import('src/pages/ramviewer');
        return html`<p-ramviewer></p-ramviewer>`;
      },
    },
    game: {
      title: i18n.get('page.game.title'),
      pattern: `/game/:${paramKeys.GAME_ID}`,
      async getContent(params: Record<string, string>) {
        await import('src/pages/game');
        return html`<p-game .gameId=${Number(params[paramKeys.GAME_ID])}></p-game>`;
      },
    },
    favorites: {
      title: i18n.get('page.favorites.title'),
      pattern: '/favorites',
      async getContent(_params: Record<string, string>) {
        await import('src/pages/favorites');
        return html`<p-favorites></p-favorites>`;
      },
    },
    rooms: {
      title: i18n.get('page.rooms.title'),
      pattern: '/rooms',
      async getContent(_params: Record<string, string>) {
        if (isMtApp) {
          await import('src/pages/mt-rooms');
          return html`<p-mt-rooms></p-mt-rooms>`;
        }
        await import('src/pages/rooms');
        return html`<p-rooms></p-rooms>`;
      },
    },
    room: {
      title: i18n.get('page.room.title'),
      pattern: `/room/:${paramKeys.ROOM_ID}`,
      async getContent(params: Record<string, string>) {
        if (isMtApp) {
          await import('src/pages/mt-room');
          return html`<p-mt-room id=${params[paramKeys.ROOM_ID]}></p-mt-room>`;
        }
        await import('src/pages/room');
        return html`<p-room id=${params[paramKeys.ROOM_ID]}></p-room>`;
      },
    },
    login: {
      title: i18n.get('page.login.title'),
      pattern: '/login',
      async getContent(_params: Record<string, string>) {
        await import('src/pages/login');
        return html`<p-login></p-login>`;
      },
    },
    register: {
      title: i18n.get('page.login.register'),
      pattern: '/register',
      async getContent(_params: Record<string, string>) {
        await import('src/pages/login');
        return html`<p-login .register=${true}></p-login>`;
      },
    },
    notfound: {
      title: i18n.get('page.notFound.title'),
      pattern: '*',
      async getContent(_params: Record<string, string>) {
        await import('src/pages/notfound');
        return html`<p-notfound></p-notfound>`;
      },
    },
  } as Record<string, RouteItem>;
};

type Routes = ReturnType<typeof getInitRoutes>;
export type Route = ValueOf<Routes>;

export const [routes, updateRoutes] = useStore(getInitRoutes() as Routes);

connect(i18n.store, () => {
  Object.entries(getInitRoutes()).forEach(([routeName, route]) => {
    routes[routeName as keyof Routes].title = route.title;
  });
  updateRoutes();
});
