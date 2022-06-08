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
import type { DuoyunCarouselElement } from 'duoyun-ui/elements/carousel';

import { theme } from 'src/theme';

import 'duoyun-ui/elements/carousel';

const style = createCSSSheet(css`
  :host {
    position: relative;
    display: block;
    width: 100%;
    box-sizing: border-box;
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
    left: 0;
    bottom: 0;
    display: flex;
  }
  .preview * {
    cursor: pointer;
    padding: 0.2em 0.7em;
    margin-inline-start: -3px;
    border: 3px solid ${theme.borderColor};
    background-color: black;
  }
  .preview .current {
    position: relative;
    border-color: ${theme.textColor};
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
        .data=${this.links.map((img) => ({ img, title: '', description: '' }))}
      ></dy-carousel>
      <div class="preview">
        ${this.links.map(
          (_, index) =>
            html`
              <div
                @click=${() => this.carouselRef.element?.jump(index)}
                class=${classMap({ current: index === this.state.current })}
              >
                ${index + 1}
              </div>
            `,
        )}
      </div>
    `;
  };
}
