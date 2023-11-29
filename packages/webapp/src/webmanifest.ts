import { utf8ToB64 } from 'duoyun-ui/lib/encode';
import { routes } from 'src/routes';

import { COMMAND } from 'src/constants';
import { i18n } from 'src/i18n/basic';

export function getWebManifestURL() {
  return `data:application/json;base64,${utf8ToB64(
    JSON.stringify(genWebManifest(), (_, value) =>
      typeof value === 'string' && value.startsWith('/') ? new URL(value, location.origin).href : value,
    ),
  )}`;
}

export function genWebManifest() {
  return {
    id: 'com.nesbox' + (COMMAND === 'serve' ? '.dev' : ''),
    name: i18n.get('global.title') + (COMMAND === 'serve' ? '(DEV)' : ''),
    short_name: i18n.get('global.title'),
    categories: ['entertainment', 'games'],
    description: i18n.get('global.sloganDesc').replaceAll('\n', ','),
    scope: '/',
    start_url: `${routes.games.pattern}?utm_source=web_app_manifest`,
    background_color: 'black',
    theme_color: 'black',
    display: 'standalone',
    orientation: 'landscape',
    file_handlers: [
      {
        action: routes.emulator.pattern,
        name: 'Game File',
        accept: {
          'application/octet-stream': ['.nes'],
        },
      },
    ],
    share_target: {
      action: '/_share_target',
      method: 'POST',
      enctype: 'multipart/form-data',
      params: {
        files: [
          {
            name: 'nes',
            accept: ['application/octet-stream', '.nes'],
          },
        ],
      },
    },
    launch_handler: {
      client_mode: 'navigate-new',
    },
    shortcuts: [
      {
        name: i18n.get('page.games.title'),
        url: routes.games.pattern,
      },
      {
        name: i18n.get('page.favorites.title'),
        url: routes.favorites.pattern,
      },
    ],
    icons: [
      {
        src: '/logo-32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/logo-96.png',
        sizes: '96x96',
        type: 'image/png',
      },
      {
        src: '/logo-maskable-144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo-144.png',
        sizes: '144x144',
        type: 'image/png',
      },
    ],
    screenshots: [
      {
        src: 'https://raw.githubusercontent.com/mantou132/nesbox/master/screenshots/homepage.png',
        sizes: '1280x861',
        type: 'image/png',
        form_factor: 'wide',
        label: 'HomeScreen of NESBox',
      },
      {
        src: 'https://raw.githubusercontent.com/mantou132/nesbox/master/screenshots/playing.png',
        sizes: '1280x861',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Playing game in NESBox',
      },
      {
        src: 'https://raw.githubusercontent.com/mantou132/nesbox/master/screenshots/settings.png',
        sizes: '1280x861',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Settings in NESBox',
      },
    ],
  };
}
