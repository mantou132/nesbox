import { html, render, history } from '@mantou/gem';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { Toast } from 'duoyun-ui/elements/toast';
import { matchPath } from '@mantou/gem/elements/route';

import { configure } from 'src/configure';
import { COMMAND, RELEASE } from 'src/constants';
import { logger } from 'src/logger';
import { routes } from 'src/routes';
import { gotoRedirectUri } from 'src/auth';

import 'src/modules/meta';
import 'src/app';

logger.info('MODE\t', import.meta.env.MODE);
logger.info('RELEASE\t', RELEASE);
logger.info('COMMAND\t', COMMAND);

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
        height: 100%;
        overflow: auto;
        scrollbar-width: thin;
        -webkit-overflow-scrolling: touch;
        margin: 0;
        padding: 0;
        font-size: 0.9rem;
      }
      @media ${mediaQuery.DESKTOP} {
        body {
          font-size: 1rem;
        }
      }
      @media ${mediaQuery.WIDTHSCREEN} {
        body {
          font-size: 1.1rem;
        }
      }
    </style>
    <m-meta></m-meta>
    <gem-route
      .routes=${[
        routes.login,
        {
          pattern: '*',
          content: html`<app-root></app-root>`,
        },
      ]}
    ></gem-route>
  `,
  document.body,
);

if (matchPath(routes.login.pattern, history.getParams().path)) {
  if (configure.profile) {
    gotoRedirectUri();
  }
}

let unloading = false;
window.addEventListener('beforeunload', () => {
  unloading = true;
  setTimeout(() => (unloading = false), 1000);
});
function printError(err: Error | ErrorEvent) {
  const ignoreError = ['ResizeObserver', 'Script error.'];
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
  navigator.serviceWorker?.register('/sw.js', { type: 'module' });
});
