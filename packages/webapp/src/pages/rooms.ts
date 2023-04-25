import { html, adoptedStyle, customElement, createCSSSheet, css, connectStore, GemElement } from '@mantou/gem';
import { polling } from 'duoyun-ui/lib/utils';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';

import { getRooms } from 'src/services/guest-api';
import { store } from 'src/store';
import { i18n } from 'src/i18n/basic';
import { icons } from 'src/icons';
import { theme } from 'src/theme';
import { configure } from 'src/configure';

import 'duoyun-ui/elements/result';
import 'duoyun-ui/elements/loading';
import 'src/modules/game-list';
import 'src/modules/room-list';
import 'src/modules/lobby-chat';

const style = createCSSSheet(css`
  :host {
    display: block;
    min-height: 100vh;
    padding-inline: ${theme.gridGutter};
    padding-block-start: ${theme.gridGutter};
  }
  .chat {
    position: fixed;
    right: ${theme.gridGutter};
    bottom: ${theme.gridGutter};
  }
`);

@customElement('p-rooms')
@adoptedStyle(style)
@connectStore(store)
@connectStore(i18n.store)
export class PRoomsElement extends GemElement {
  mounted = () => {
    this.effect(
      () => polling(getRooms, 7_000),
      () => [i18n.currentLanguage],
    );
  };

  render = () => {
    return html`
      ${!store.roomIds
        ? html`<dy-loading></dy-loading>`
        : store.roomIds.length === 0
        ? html`
            <dy-result style="height: 60vh" .illustrator=${icons.empty} .header=${i18n.get('notDataTitle')}></dy-result>
          `
        : html`<m-room-list></m-room-list>`}
      ${!mediaQuery.isPhone && configure.user ? html`<m-lobby-chat class="chat"></m-lobby-chat>` : ''}
    `;
  };
}
