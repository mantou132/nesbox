import { history, html, render, styleMap } from '@mantou/gem';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { DuoyunDropAreaElement } from 'duoyun-ui/elements/drop-area';
import { createPath } from 'duoyun-ui/elements/route';
import { isInputElement } from 'duoyun-ui/lib/element';
import { isMtApp, mtApp } from '@nesbox/mtapp';
import { initApp } from 'duoyun-ui/helper/webapp';
import { routes } from 'src/routes';

import { logger } from 'src/logger';
import { matchRoute } from 'src/utils/common';
import { COMMAND, globalEvents, isApp, isTauriMacApp, isTauriWinApp, RELEASE } from 'src/constants';
import { theme } from 'src/theme';
import { configure } from 'src/configure';
import { gotoRedirectUri, isExpiredProfile, logout } from 'src/auth';
import { GamepadBtnIndex, listenerGamepad, startKeyboardSimulation } from 'src/gamepad';
import { dropHandler } from 'src/drop';

import 'duoyun-ui/helper/error';
import 'src/modules/meta';

listenerGamepad();

logger.info('MODE\t', import.meta.env.MODE);
logger.info('RELEASE\t', RELEASE);
logger.info('COMMAND\t', COMMAND);

// Fixed chrome viewport
Object.assign((navigator as any).virtualKeyboard || {}, { overlaysContent: true });

if (isMtApp) {
  startKeyboardSimulation();
  mtApp.setOrientation('landscape').catch(() => 0);
  mtApp.setStatusBarStyle('none').catch(() => 0);
}

if (isTauriWinApp || isTauriMacApp) {
  import('src/elements/titlebar');
}

if ([routes.home].some(matchRoute) && isApp) {
  history.replace({ path: createPath(routes.games) });
}

if ([routes.login, routes.register].some(matchRoute)) {
  if (configure.profile) {
    gotoRedirectUri();
  }
} else if (
  [
    routes.download,
    routes.home,
    routes.emulator,
    routes.privacy,
    routes.ramviewer,
    ...(isApp ? [] : [routes.games, routes.rooms, routes.game]),
  ].some(matchRoute)
) {
  logger.info('Welcome!');
} else if (!configure.profile || isExpiredProfile(configure.profile)) {
  logout();
}

render(
  html`
    <style>
      :root {
        font-family: 'HarmonyOS Sans', -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto,
          'Helvetica Neue', Arial, 'Noto Sans', 'PingFang SC', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji',
          'Segoe UI Symbol', 'Noto Color Emoji';
        font-weight: 400;
        font-feature-settings: 'kern' 1;
        font-kerning: normal;
        -moz-osx-font-smoothing: grayscale;
        -webkit-font-smoothing: antialiased;
        -webkit-tap-highlight-color: transparent;
        height: 100%;
        overflow: hidden;
        overscroll-behavior: none;
      }
      body {
        display: flex;
        flex-direction: column;
        height: 100%;
        margin: 0;
        padding: 0;
        font-size: 1rem;
        color: ${theme.textColor};
        background: ${theme.backgroundColor};
      }
      dy-drop-area {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }
      @media ${mediaQuery.DESKTOP} {
        body {
          font-size: 1.1rem;
        }
      }
      @media ${mediaQuery.WIDTHSCREEN} {
        body {
          font-size: 1.2rem;
        }
      }
    </style>
    <m-meta></m-meta>
    ${isTauriWinApp || isTauriMacApp
      ? html`
          <m-titlebar
            style=${styleMap({ background: theme.titleBarColor })}
            type=${isTauriWinApp ? 'win' : 'mac'}
          ></m-titlebar>
        `
      : ''}
    <dy-drop-area
      @change=${(evt: CustomEvent<File[]>) => evt.target instanceof DuoyunDropAreaElement && dropHandler(evt.detail)}
    >
      <dy-route
        .routes=${[
          routes.login,
          routes.register,
          routes.home,
          routes.download,
          routes.emulator,
          routes.privacy,
          routes.ramviewer,
          {
            pattern: '*',
            getContent() {
              if (isMtApp) {
                import('src/mt-app');
                return html`<mt-app-root></mt-app-root>`;
              }
              import('src/app');
              return html`<app-root></app-root>`;
            },
          },
        ]}
      >
      </dy-route>
    </dy-drop-area>
  `,
  document.body,
);

addEventListener(globalEvents.PRESS_HOST_BUTTON_INDEX, ({ timeStamp, detail }) => {
  if (detail === GamepadBtnIndex.FrontLeftTop) {
    addEventListener(
      globalEvents.RELEASE_HOST_BUTTON_INDEX,
      (evt) => {
        if (evt.timeStamp - timeStamp > 3000) {
          close();
        }
      },
      { once: true },
    );
  }
});

// https://github.com/tauri-apps/tauri/issues/2626#issuecomment-1151090395
addEventListener(
  'keydown',
  (event) => {
    if (isTauriMacApp && event.key !== 'Tab') {
      const ele = event.composedPath()[0];
      if (!ele || !isInputElement(ele as HTMLElement) || event.key === 'Escape') {
        // not system shortcut
        if (!(event.key === 'w' && (event.ctrlKey || event.metaKey))) {
          event.preventDefault();
        }
      }
    }
  },
  { capture: true },
);

addEventListener('contextmenu', (evt) => {
  const ele = evt.composedPath()[0];
  if (isApp && !isInputElement(ele as HTMLElement)) {
    evt.preventDefault();
  }
});

addEventListener('load', () => {
  logger.info('Loaded!');
});

initApp({
  serviceWorkerScript: COMMAND === 'build' ? '/sw.js' : '',
  initWindowSize: [1024, 640],
});
