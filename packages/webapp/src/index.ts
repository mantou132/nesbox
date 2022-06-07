import { html, render, history } from '@mantou/gem';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { Toast } from 'duoyun-ui/elements/toast';
import { matchPath } from 'duoyun-ui/elements/route';

import { theme } from 'src/theme';
import { configure } from 'src/configure';
import { COMMAND, RELEASE } from 'src/constants';
import { logger } from 'src/logger';
import { routes } from 'src/routes';
import { gotoRedirectUri, isExpiredProfile, logout } from 'src/auth';

import 'src/modules/meta';

logger.info('MODE\t', import.meta.env.MODE);
logger.info('RELEASE\t', RELEASE);
logger.info('COMMAND\t', COMMAND);

if (
  matchPath(routes.login.pattern, history.getParams().path) ||
  matchPath(routes.register.pattern, history.getParams().path)
) {
  if (configure.profile) {
    gotoRedirectUri();
  }
} else if (!configure.profile || isExpiredProfile(configure.profile)) {
  logout();
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
      }
      html {
        height: 100%;
        overflow: hidden;
      }
      body {
        color-scheme: dark;
        height: 100%;
        overflow: auto;
        scrollbar-width: thin;
        -webkit-overflow-scrolling: touch;
        margin: 0;
        padding: 0;
        font-size: 1rem;
        color: ${theme.textColor};
        background-color: ${theme.backgroundColor};
        scrollbar-width: thin;
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
    <dy-route
      .routes=${[
        routes.login,
        routes.register,
        {
          pattern: '*',
          getContent() {
            import('src/app');
            return html`<app-root></app-root>`;
          },
        },
      ]}
    ></dy-route>
  `,
  document.body,
);

let unloading = false;
window.addEventListener('beforeunload', () => {
  unloading = true;
  setTimeout(() => (unloading = false), 1000);
});
function printError(err: Error | ErrorEvent) {
  const ignoreError = [
    // chrome
    'ResizeObserver',
    'Script error.',
    // firefox
    'error loading dynamically imported module',
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
addEventListener('load', () => {
  if (COMMAND === 'build') {
    navigator.serviceWorker?.register('/sw.js', { type: 'module' });
  }
});
