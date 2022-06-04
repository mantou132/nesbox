import { html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';
import { polling } from 'duoyun-ui/lib/utils';

import { getRooms } from 'src/services/api';
import { store } from 'src/store';
import { i18n } from 'src/i18n';
import { icons } from 'src/icons';
import { PBaseElement } from 'src/pages/base';
import { theme } from 'src/theme';

import 'duoyun-ui/elements/result';
import 'src/modules/nav';
import 'src/modules/room-list';
import 'src/modules/footer';

const style = createCSSSheet(css`
  main {
    margin-block-start: ${theme.gridGutter};
    padding-inline: ${theme.gridGutter};
  }
`);

@customElement('p-rooms')
@adoptedStyle(style)
@connectStore(store)
export class PRoomsElement extends PBaseElement {
  mounted = () => {
    return polling(getRooms, 10_000);
  };

  render = () => {
    return html`
      <m-nav></m-nav>
      <main>
        ${store.roomIds?.length === 0
          ? html`
              <dy-result
                style="height: 60vh"
                .illustrator=${icons.empty}
                .header=${i18n.get('notDataTitle')}
              ></dy-result>
            `
          : html`<m-room-list></m-room-list>`}
      </main>
      <m-footer></m-footer>
    `;
  };
}
