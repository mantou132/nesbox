import {
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  history,
  styleMap,
  GemElement,
} from '@mantou/gem';
import { createPath } from 'duoyun-ui/elements/route';
import { HexColor, hslToRgb, parseHexColor, rgbToHexColor, rgbToHsl } from 'duoyun-ui/lib/color';
import { marked } from 'marked';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { waitLoading } from 'duoyun-ui/elements/wait';
import { Modal } from 'duoyun-ui/elements/modal';

import { store } from 'src/store';
import { routes } from 'src/routes';
import { githubIssue, paramKeys } from 'src/constants';
import { createRoom } from 'src/services/api';
import { theme, themeStore } from 'src/theme';
import { i18n } from 'src/i18n';
import { icons } from 'src/icons';
import { getCorsSrc, getGithubGames, open } from 'src/utils';

import 'duoyun-ui/elements/carousel';
import 'src/modules/game-list';

const domParser = new DOMParser();

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column;
    gap: 1.5em;
    min-height: 100vh;
  }
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
  .add {
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    aspect-ratio: 503/348;
    gap: 1em;
    border: 1px dashed currentColor;
  }
  .add dy-use {
    width: 3em;
  }
`);

type State = {
  background: string;
};

@customElement('p-games')
@adoptedStyle(style)
@connectStore(i18n.store)
@connectStore(store)
export class PGamesElement extends GemElement<State> {
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

  #addGame = async () => {
    // 重名添加 `（中文/日本語）`
    const map = new Map(store.allGames.map((e) => [e.name.replace(/（.*）$/, ''), e.id]));
    await Modal.confirm(
      html`<div style="width:min(400px, 100vw)">
        ${i18n.get(
          'addGameDetail',
          (e) => html`<a target="_blank" href="https://github.com/mantou132/nesbox/releases/tag/0.0.1">${e}</a>`,
        )}
      </div>`,
    );
    const list: any[] = await waitLoading(
      (await fetch(getCorsSrc('https://github.com/mantou132/nesbox/releases/download/0.0.1/matedata.json'))).json(),
    );
    const find = async (list: any[]): Promise<any> => {
      const index = list.findIndex((e) => !map.has(e.title) && e.title !== '马力欧兄弟/水管马力欧');
      const item = list[index];
      if (!item) return;
      const link = (await getGithubGames(item.title)).find((e) => e.textContent === e.title);
      return link ? await find(list.slice(index, list.length)) : item;
    };
    const item = await waitLoading(find(list));
    if (item) {
      open(
        `${githubIssue}/new?${new URLSearchParams({
          title: item.title,
          body: item.description,
          labels: 'game',
          assignees: 'mantou132',
        })}`,
      );
    }
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
      <dy-carousel
        class="top"
        style=${styleMap({ background: this.state.background })}
        .data=${topData}
        @change=${({ detail }: CustomEvent<number>) => this.#onTopChange(detail, topData?.length)}
      ></dy-carousel>
      <m-game-list class="list">
        <div class="add" @click=${this.#addGame}>
          <dy-use .element=${icons.add}></dy-use>
          <span>${i18n.get('addGame')}</span>
        </div>
      </m-game-list>
    `;
  };
}
