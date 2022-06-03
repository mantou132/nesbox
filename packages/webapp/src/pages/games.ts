import { html, adoptedStyle, customElement, createCSSSheet, css, connectStore, history } from '@mantou/gem';
import { createPath } from 'duoyun-ui/elements/route';
import { marked } from 'marked';

import { store } from 'src/store';
import { PBaseElement } from 'src/pages/base';
import { routes } from 'src/routes';
import { paramKeys } from 'src/constants';
import { createRoom } from 'src/services/api';

import 'duoyun-ui/elements/carousel';
import 'src/modules/nav';
import 'src/modules/game-list';
import 'src/modules/footer';

const domParser = new DOMParser();

const style = createCSSSheet(css`
  .top {
    cursor: pointer;
  }
  .top::part(img) {
    position: absolute;
    right: 3em;
    width: min(40%, 30em);
    object-fit: contain;
    --mask-range: 0;
  }
`);

@customElement('p-games')
@adoptedStyle(style)
@connectStore(store)
export class PGamesElement extends PBaseElement {
  render = () => {
    return html`
      <m-nav></m-nav>
      <main>
        <dy-carousel
          class="top"
          .data=${store.topGameIds?.map((id) => ({
            onClick: () =>
              history.push({ path: createPath(routes.game, { params: { [paramKeys.GAME_ID]: String(id) } }) }),
            description:
              domParser.parseFromString(marked.parse(store.games[id]?.description || ''), 'text/html').body
                .textContent || '',
            img: store.games[id]?.preview || '',
            title: store.games[id]?.name || '',
            background: '#9d8e72',
            action: {
              text: '开始游戏',
              handle: () => createRoom({ private: false, gameId: id }),
            },
          }))}
        ></dy-carousel>
        <m-game-list></m-game-list>
      </main>
      <m-footer></m-footer>
    `;
  };
}
