import { html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';

import { store } from 'src/store';
import { PBaseElement } from 'src/pages/base';
import { icons } from 'src/icons';
import { i18n } from 'src/i18n';
import { theme } from 'src/theme';

import 'duoyun-ui/elements/carousel';
import 'src/modules/nav';
import 'src/modules/game-list';
import 'src/modules/footer';

const style = createCSSSheet(css`
  main {
    margin-block-start: ${theme.gridGutter};
    padding-inline: ${theme.gridGutter};
  }
`);

@customElement('p-favorites')
@adoptedStyle(style)
@connectStore(i18n.store)
@connectStore(store)
export class PFavoritesElement extends PBaseElement {
  render = () => {
    return html`
      <m-nav></m-nav>
      <main>
        ${store.favoriteIds?.length === 0
          ? html`
              <dy-result
                style="height: 60vh"
                .illustrator=${icons.empty}
                .header=${i18n.get('notDataTitle')}
              ></dy-result>
            `
          : html`<m-game-list .favorite=${true}></m-game-list>`}
      </main>
      <m-footer></m-footer>
    `;
  };
}
