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
import { isNotNullish } from 'duoyun-ui/lib/types';
import { routes } from 'src/routes';

import { fontLoading, getCDNSrc, setViewTransitionName } from 'src/utils/common';
import { paramKeys, pixelFont, viewTransitionName } from 'src/constants';
import { store } from 'src/store';
import { createRoom } from 'src/services/api';
import { theme, themeStore } from 'src/theme';
import { i18n } from 'src/i18n/basic';

import 'duoyun-ui/elements/carousel';
import 'duoyun-ui/elements/link';
import 'duoyun-ui/elements/paragraph';
import 'src/modules/game-list';

const domParser = new DOMParser();

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    min-height: 100vh;
  }
  .top {
    cursor: pointer;
    transition: all 0.5s ${theme.timingEasingFunction};
    background-size: auto 3em;
    image-rendering: pixelated;
  }
  .top::part(img) {
    --mask-range: 0;
    inset: 0 3em 0 auto;
    margin: auto;
    width: auto;
    max-width: 40%;
    max-height: calc(100% - 6em);
    object-fit: cover;
    border-radius: calc(2 * ${theme.normalRound});
    box-shadow: 0 0 0 0.5px ${theme.borderColor};
    image-rendering: pixelated;
  }
  .list {
    padding-inline: ${theme.gridGutter};
  }
  @media ${mediaQuery.PHONE} {
    .top {
      aspect-ratio: 2/1;
      margin-block-end: 1em;
    }
    .top::part(img) {
      --mask-range: 50%;
      inset: 0;
      width: 100%;
      max-width: none;
      max-height: 100%;
      border-radius: 0;
    }
    .top::part(description),
    .top::part(button) {
      display: none;
    }
    .top::part(title) {
      margin-block-end: 0.5em;
    }
    .top::part(content) {
      justify-content: flex-end;
    }
    .top::part(nav) {
      bottom: -1.5em;
    }
    .top::part(content) {
      padding-inline: ${theme.gridGutter};
      max-width: 100%;
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
    border-radius: ${theme.normalRound};
  }
  .add dy-use {
    width: 3em;
  }
`);

type State = {
  background: string;
  backgroundImage: string;
};

/**
 * @customElement p-games
 */
@customElement('p-games')
@adoptedStyle(style)
@connectStore(i18n.store)
@connectStore(store)
export class PGamesElement extends GemElement<State> {
  state: State = {
    background: 'transparent',
    backgroundImage: 'none',
  };

  #canvas = document.createElement('canvas');

  #getBackgroundImageUrl = async (text: string) => {
    await fontLoading(pixelFont);
    const font = `bold 10px '${pixelFont.family}', sans-serif`;
    const ctx = this.#canvas.getContext('2d')!;
    const paddingInline = 16;
    const paddingBlock = 8;
    ctx.font = font;
    const box = ctx.measureText(text);
    const textWidth = box.actualBoundingBoxRight - box.actualBoundingBoxLeft;
    const textHeight = box.actualBoundingBoxAscent + box.actualBoundingBoxDescent;
    this.#canvas.width = textWidth + paddingInline;
    this.#canvas.height = (textHeight + paddingBlock) * 2;
    const x = paddingBlock / 2;
    const y = box.actualBoundingBoxAscent + paddingInline / 2;
    ctx.fillStyle = '#ffffff08';
    ctx.font = font;
    ctx.fillText(text, x, y);
    ctx.fillText(text, x - (textWidth + paddingInline) / 2, y + (textHeight + paddingBlock));
    ctx.fillText(text, x + (textWidth + paddingInline) / 2, y + (textHeight + paddingBlock));
    return this.#canvas.toDataURL();
  };

  #onTopChange = async (index: number, length = 5) => {
    // primaryColor 对比色
    if (mediaQuery.isPhone) return;
    const [hux] = rgbToHsl(parseHexColor(themeStore.primaryColor as HexColor));
    const blockRange = 0.4;
    this.setState({
      background: rgbToHexColor(
        hslToRgb([(hux + blockRange / 2 + ((index * 2) % length) * ((1 - blockRange) / length)) % 1, 0.17, 0.53]),
      ),
    });
    const game = store.games[store.topGameIds?.[index] || 0];
    const dataUrl = await this.#getBackgroundImageUrl(
      [game?.platform, game?.series, game?.name].filter(isNotNullish).join(' ').toUpperCase(),
    );
    this.setState({
      backgroundImage: `url(${dataUrl})`,
    });
  };

  render = () => {
    const topData = store.topGameIds?.map((id) => ({
      onClick: (evt: PointerEvent) => {
        setViewTransitionName((evt.currentTarget as HTMLElement).querySelector('img'), viewTransitionName.PREVIEW);
        history.push({ path: createPath(routes.game, { params: { [paramKeys.GAME_ID]: String(id) } }) });
      },
      description: domParser
        .parseFromString(marked.parse(store.games[id]?.description || ''), 'text/html')
        .body.textContent?.trim()
        .slice(0, 150),
      img: getCDNSrc(store.games[id]?.preview || ''),
      title: store.games[id]?.name,
      action: {
        text: i18n.get('startGame'),
        handle: () => createRoom({ private: false, gameId: id }),
      },
    }));

    return html`
      <dy-carousel
        class="top"
        style=${styleMap({ backgroundColor: this.state.background, backgroundImage: this.state.backgroundImage })}
        .data=${topData}
        .interval=${7000}
        @change=${({ detail }: CustomEvent<number>) => this.#onTopChange(detail, topData?.length)}
      ></dy-carousel>
      <m-game-list class="list" .recent=${true}></m-game-list>
      <m-game-list class="list" .new=${true}></m-game-list>
      <m-game-list class="list" .all=${true}></m-game-list>
    `;
  };
}
