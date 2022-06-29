import { html, render, history, styleMap } from '@mantou/gem';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { Toast } from 'duoyun-ui/elements/toast';
import { matchPath, RouteItem } from 'duoyun-ui/elements/route';

import { theme } from 'src/theme';
import { configure } from 'src/configure';
import { COMMAND, isTauriMacApp, isTauriWinApp, RELEASE } from 'src/constants';
import { logger } from 'src/logger';
import { routes } from 'src/routes';
import { gotoRedirectUri, isExpiredProfile, logout } from 'src/auth';
import { isInputElement } from 'src/utils';
import { listener } from 'src/gamepad';

import 'src/modules/meta';

listener();

logger.info('MODE\t', import.meta.env.MODE);
logger.info('RELEASE\t', RELEASE);
logger.info('COMMAND\t', COMMAND);

const match = (route: RouteItem) => matchPath(route.pattern, history.getParams().path);

if ([routes.login, routes.register].some(match)) {
  if (configure.profile) {
    gotoRedirectUri();
  }
} else if ([routes.download].some(match)) {
  //
} else if (!configure.profile || isExpiredProfile(configure.profile)) {
  logout(true);
}

render(
  html`
    <style>
      :root {
        font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
          'Noto Sans', 'PingFang SC', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
          'Noto Color Emoji';
        -moz-osx-font-smoothing: grayscale;
        -webkit-font-smoothing: antialiased;
        height: 100%;
        overflow: hidden;
      }
      body {
        display: flex;
        flex-direction: column;
        height: 100%;
        margin: 0;
        padding: 0;
        font-size: 1rem;
        color: ${theme.textColor};
        background-color: ${theme.backgroundColor};
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
    <dy-route
      @contextmenu=${(e: Event) => e.preventDefault()}
      .routes=${[
        routes.login,
        routes.register,
        routes.download,
        {
          pattern: '*',
          getContent() {
            import('src/app');
            return html`<app-root></app-root>`;
          },
        },
      ]}
    >
    </dy-route>
  `,
  document.body,
);

if (isTauriWinApp || isTauriMacApp) {
  import('src/elements/titlebar');
}

let unloading = false;
addEventListener('beforeunload', () => {
  unloading = true;
  setTimeout(() => (unloading = false), 1000);
});
function printError(err: Error | ErrorEvent) {
  const ignoreError = [
    // chrome
    'ResizeObserver',
    'Script error.',
  ];
  if (unloading || ignoreError.some((msg) => err.message?.startsWith(msg))) return;
  Toast.open('error', err.message || String(err));
}

function handleRejection({ reason }: PromiseRejectionEvent) {
  if (reason) {
    const errors = reason.errors || reason;
    if (Array.isArray(errors)) {
      errors.forEach((err) => printError(err));
    } else {
      printError(reason.reason || reason);
    }
  }
}

addEventListener('error', printError);
addEventListener('unhandledrejection', handleRejection);

// https://github.com/tauri-apps/tauri/issues/2626#issuecomment-1151090395
addEventListener('keypress', (event) => {
  if (isTauriMacApp && !isInputElement(event)) {
    event.preventDefault();
  }
});

if (COMMAND === 'build') {
  navigator.serviceWorker?.register('/sw.js', { type: 'module' });
} else {
  navigator.serviceWorker.getRegistration().then((reg) => reg?.unregister());
}
