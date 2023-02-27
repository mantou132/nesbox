import { render, html } from '@mantou/gem';
import { theme } from 'duoyun-ui/lib/theme';

import { routes } from 'src/routes';

import 'duoyun-ui/elements/route';
import 'duoyun-ui/elements/side-navigation';

render(
  html`
    <style>
      :root {
        font-family: -apple-system, system-ui, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial,
          'Noto Sans', 'PingFang SC', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol',
          'Noto Color Emoji';
      }
      html {
        height: 100%;
      }
      body {
        display: flex;
        height: 100%;
        background-color: ${theme.backgroundColor};
        overflow: auto;
        scrollbar-width: thin;
        -webkit-overflow-scrolling: touch;
        margin: 0;
        padding: 0;
        font-size: 0.9rem;
      }
      nav {
        width: 16em;
        height: 100%;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        background-color: ${theme.lightBackgroundColor};
        padding-block: calc(2 * ${theme.gridGutter});
        padding-inline: ${theme.gridGutter};
      }
      .main-container {
        height: 100%;
        overflow: auto;
        flex-grow: 1;
        min-width: auto;
      }
      .main {
        margin: auto;
        padding: calc(2 * ${theme.gridGutter});
        max-width: 80em;
      }
    </style>
    <nav>
      <dy-side-navigation .items=${Object.values(routes).filter((e) => !!e.getContent)}></dy-side-navigation>
    </nav>
    <div class="main-container">
      <main class="main" aria-label="Content">
        <dy-route .routes=${routes}></dy-route>
      </main>
    </div>
  `,
  document.body,
);
