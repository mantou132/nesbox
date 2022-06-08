import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, property } from '@mantou/gem';

import 'duoyun-ui/elements/carousel';

const style = createCSSSheet(css`
  :host {
    position: relative;
    display: block;
    width: 100%;
  }
  .carousel {
    aspect-ratio: 503/348;
  }
  .carousel::part(img) {
    --mask-range: 0;
    object-fit: contain;
  }
  .carousel::part(nav) {
    display: none;
  }
`);

/**
 * @customElement m-screenshots
 */
@customElement('m-screenshots')
@adoptedStyle(style)
export class MScreenshotsElement extends GemElement {
  @property links?: string[];

  render = () => {
    if (!this.links?.length) return html``;
    return html`
      <dy-carousel
        class="carousel"
        .data=${this.links.map((img) => ({ img, title: '', description: '' }))}
      ></dy-carousel>
    `;
  };
}
