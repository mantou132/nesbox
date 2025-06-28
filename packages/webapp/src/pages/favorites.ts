import { adoptedStyle, connectStore, css, customElement, GemElement, html, mounted } from '@mantou/gem';
import { i18n } from 'src/i18n/basic';
import { icons } from 'src/icons';
import { getGameIds } from 'src/services/api';
import { store } from 'src/store';
import { theme } from 'src/theme';

import 'duoyun-ui/elements/result';
import 'src/modules/game-list';

const style = css`
  :scope {
    display: block;
    min-height: 100vh;
    padding-inline: ${theme.gridGutter};
    padding-block-start: ${theme.gridGutter};
  }
`;

@customElement('p-favorites')
@adoptedStyle(style)
@connectStore(store)
export class PFavoritesElement extends GemElement {
  @mounted()
  #init = getGameIds;

  render = () => {
    return html`
      ${
        store.favoriteIds?.length === 0
          ? html`
            <dy-result
              style="height: 60vh"
              .illustrator=${icons.empty}
              .header=${i18n.get('global.noData')}
            ></dy-result>
          `
          : html`<m-game-list .favorite=${true}></m-game-list>`
      }
    `;
  };
}
