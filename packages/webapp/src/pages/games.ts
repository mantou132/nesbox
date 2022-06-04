import { html, adoptedStyle, customElement, createCSSSheet, css, connectStore, history, styleMap } from '@mantou/gem';
import { createPath } from 'duoyun-ui/elements/route';
import { HexColor, hslToRgb, parseHexColor, rgbToHexColor, rgbToHsl } from 'duoyun-ui/lib/color';
import { marked } from 'marked';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';

import { store } from 'src/store';
import { PBaseElement } from 'src/pages/base';
import { routes } from 'src/routes';
import { paramKeys } from 'src/constants';
import { createRoom } from 'src/services/api';
import { theme, themeStore } from 'src/theme';
import { i18n } from 'src/i18n';

import 'duoyun-ui/elements/carousel';
import 'src/modules/nav';
import 'src/modules/game-list';
import 'src/modules/footer';

const domParser = new DOMParser();

const style = createCSSSheet(css`
  .top {
    cursor: pointer;
    transition: all 0.5s ${theme.timingEasingFunction};
  }
  .top::part(img) {
    --mask-range: 0;
    right: 3em;
    width: min(40%, 30em);
    object-fit: contain;
  }
  .list {
    padding-inline: ${theme.gridGutter};
  }
  @media ${mediaQuery.PHONE} {
    .top {
      aspect-ratio: 2/1;
    }
    .top::part(img) {
      right: 0;
      width: 100%;
      object-fit: cover;
    }
    .top::part(title) {
      text-shadow: 0 0.1em 0.3em rgba(0, 0, 0, ${theme.maskAlpha});
    }
    .top::part(description) {
      display: none;
    }
    .top::part(content) {
      padding-inline: ${theme.gridGutter};
      max-width: 75%;
    }
  }
`);

type State = {
  background: string;
};

@customElement('p-games')
@adoptedStyle(style)
@connectStore(i18n.store)
@connectStore(store)
export class PGamesElement extends PBaseElement<State> {
  state: State = {
    background: 'transparent',
  };

  #onTopChange = async (index: number, length = 5) => {
    // primaryColor 对比色
    const [hux] = rgbToHsl(parseHexColor(themeStore.primaryColor as HexColor));
    const blockRange = 0.4;
    this.setState({
      background: rgbToHexColor(
        hslToRgb([(hux + blockRange / 2 + ((index * 2) % length) * ((1 - blockRange) / length)) % 1, 0.17, 0.53]),
      ),
    });
  };

  render = () => {
    const topData = store.topGameIds?.map((id) => ({
      onClick: () => history.push({ path: createPath(routes.game, { params: { [paramKeys.GAME_ID]: String(id) } }) }),
      description: domParser
        .parseFromString(marked.parse(store.games[id]?.description || ''), 'text/html')
        .body.textContent?.trim()
        .slice(0, 150),
      img: store.games[id]?.preview || '',
      title: store.games[id]?.name,
      action: {
        text: i18n.get('startGame'),
        handle: () => createRoom({ private: false, gameId: id }),
      },
    }));

    return html`
      <m-nav></m-nav>
      <main>
        <dy-carousel
          class="top"
          style=${styleMap({ background: this.state.background })}
          .data=${topData}
          @change=${({ detail }: CustomEvent<number>) => this.#onTopChange(detail, topData?.length)}
        ></dy-carousel>
        <m-game-list class="list"></m-game-list>
      </main>
      <m-footer></m-footer>
    `;
  };
}
