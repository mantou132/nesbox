import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, property } from '@mantou/gem';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';

import { getCDNSrc } from 'src/utils/common';
import { theme } from 'src/theme';
import { viewTransitionName } from 'src/constants';
import { Game } from 'src/store';

const style = createCSSSheet(css`
  :host {
    display: flex;
    gap: ${theme.gridGutter};
    overflow: auto;
    filter: drop-shadow(0 0 0.5px ${theme.borderColor});
    scrollbar-width: none;
    scroll-snap-type: x mandatory;
  }
  .img:first-of-type {
    view-transition-name: ${viewTransitionName.PREVIEW};
  }
  .img {
    scroll-snap-align: start;
    flex-shrink: 0;
    width: calc(50% - ${theme.gridGutter} / 2);
    aspect-ratio: 503/348;
    background-color: black;
    object-fit: contain;
    image-rendering: pixelated;
    filter: ${theme.imageFilter};
    border-radius: ${theme.normalRound};
  }
  @media ${mediaQuery.PHONE} {
    .img {
      width: 100%;
    }
  }
`);
type State = {
  current: number;
};

/**
 * @customElement m-screenshots
 */
@customElement('m-screenshots')
@adoptedStyle(style)
export class MScreenshotsElement extends GemElement<State> {
  @property game?: Game;

  render = () => {
    if (!this.game) return html``;
    const links =
      this.game.screenshots.length > 1 ? this.game.screenshots : [this.game.preview, ...this.game.screenshots];

    return html`
      ${links.map(
        (link) => html`
          <img class="img" draggable="false" loading="lazy" src=${getCDNSrc(link)}></img>
        `,
      )}
    `;
  };
}
