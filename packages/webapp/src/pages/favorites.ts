import { html, adoptedStyle, customElement, createCSSSheet, css, connectStore, GemElement } from '@mantou/gem';

import { store } from 'src/store';
import { icons } from 'src/icons';
import { i18n } from 'src/i18n';
import { theme } from 'src/theme';

import 'duoyun-ui/elements/carousel';
import 'src/modules/game-list';

const style = createCSSSheet(css`
  :host {
    display: block;
    min-height: 100vh;
    margin-block-start: ${theme.gridGutter};
    padding-inline: ${theme.gridGutter};
  }
`);

@customElement('p-favorites')
@adoptedStyle(style)
@connectStore(i18n.store)
@connectStore(store)
export class PFavoritesElement extends GemElement {
  render = () => {
    return html`
      ${store.favoriteIds?.length === 0
        ? html`
            <dy-result style="height: 60vh" .illustrator=${icons.empty} .header=${i18n.get('notDataTitle')}></dy-result>
          `
        : html`<m-game-list .favorite=${true}></m-game-list>`}
    `;
  };
}
