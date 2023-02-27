import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  property,
  classMap,
  refobject,
  RefObject,
} from '@mantou/gem';
import { getCDNSrc } from 'src/utils';

import { theme } from 'src/theme';

import type { DuoyunCarouselElement } from 'duoyun-ui/elements/carousel';

import 'duoyun-ui/elements/carousel';

const style = createCSSSheet(css`
  :host {
    position: relative;
    display: block;
    width: 100%;
    box-sizing: border-box;
    border-radius: ${theme.normalRound};
    overflow: hidden;
  }
  .carousel {
    aspect-ratio: 503/348;
    background-color: black;
  }
  .carousel::part(img) {
    --mask-range: 0;
    object-fit: contain;
  }
  .carousel::part(nav),
  .carousel::part(content) {
    display: none;
  }
  .preview {
    position: absolute;
    right: 0.75em;
    bottom: 0.75em;
    display: flex;
    gap: 0.5em;
  }
  .preview * {
    cursor: pointer;
    background: ${theme.borderColor};
    padding: 0.4em 0.7em;
    border: 1px solid ${theme.textColor};
    border-radius: ${theme.smallRound};
  }
  .preview .current {
    position: relative;
    background: ${theme.textColor};
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
  @property links?: string[];
  @refobject carouselRef: RefObject<DuoyunCarouselElement>;

  state: State = {
    current: 0,
  };

  render = () => {
    if (!this.links?.length) return html``;
    return html`
      <dy-carousel
        ref=${this.carouselRef.ref}
        @change=${({ detail }: CustomEvent<number>) => this.setState({ current: detail })}
        class="carousel"
        .interval=${5000}
        .data=${this.links.map((img) => ({ img: getCDNSrc(img), title: '', description: '' }))}
      ></dy-carousel>
      <div class="preview">
        ${this.links.map(
          (_, index) =>
            html`
              <div
                @click=${() => this.carouselRef.element?.jump(index)}
                class=${classMap({ current: index === this.state.current })}
              ></div>
            `,
        )}
      </div>
    `;
  };
}
