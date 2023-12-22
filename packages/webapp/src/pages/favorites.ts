import { html, adoptedStyle, customElement, createCSSSheet, css, connectStore, GemElement } from '@mantou/gem';

import { store } from 'src/store';
import { icons } from 'src/icons';
import { i18n } from 'src/i18n/basic';
import { theme } from 'src/theme';
import { getGameIds } from 'src/services/api';

import 'duoyun-ui/elements/result';
import 'src/modules/game-list';

const style = createCSSSheet(css`
  :host {
    display: block;
    min-height: 100vh;
    padding-inline: ${theme.gridGutter};
    padding-block-start: ${theme.gridGutter};
  }
`);

/**
 * @customElement p-favorites
 */
@customElement('p-favorites')
@adoptedStyle(style)
@connectStore(i18n.store)
@connectStore(store)
export class PFavoritesElement extends GemElement {
  mounted = () => {
    getGameIds();
  };

  render = () => {
    return html`
      ${store.favoriteIds?.length === 0
        ? html`
            <dy-result
              style="height: 60vh"
              .illustrator=${icons.empty}
              .header=${i18n.get('global.noData')}
            ></dy-result>
          `
        : html`<m-game-list .favorite=${true}></m-game-list>`}
    `;
  };
}
