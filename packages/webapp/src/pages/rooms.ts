import { adoptedStyle, connectStore, css, customElement, effect, GemElement, html } from '@mantou/gem';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { polling } from 'duoyun-ui/lib/timer';
import { configure } from 'src/configure';
import { i18n } from 'src/i18n/basic';
import { icons } from 'src/icons';
import { getRooms } from 'src/services/guest-api';
import { store } from 'src/store';
import { theme } from 'src/theme';

import 'duoyun-ui/elements/loading';
import 'duoyun-ui/elements/result';
import 'src/modules/game-list';
import 'src/modules/lobby-chat';
import 'src/modules/room-list';

const style = css`
  :scope {
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
`;

@customElement('p-rooms')
@adoptedStyle(style)
@connectStore(store)
export class PRoomsElement extends GemElement {
  @effect(() => [i18n.currentLanguage])
  #init = () => polling(getRooms, 7_000);

  render = () => {
    return html`
      <dy-loading v-if=${!store.roomIds}></dy-loading>
      <dy-result
        v-if=${store.roomIds?.length === 0}
        style="height: 60vh"
        .illustrator=${icons.empty}
        .header=${i18n.get('global.noData')}
      ></dy-result>
      <m-room-list v-else></m-room-list>
      <m-lobby-chat v-if=${!mediaQuery.isPhone && !!configure.user} class="chat"></m-lobby-chat>
    `;
  };
}
