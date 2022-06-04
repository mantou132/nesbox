import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, attribute } from '@mantou/gem';
import { marked } from 'marked';

import 'duoyun-ui/elements/unsafe';

const style = createCSSSheet(css`
  :host {
    display: block;
    font-size: 1.125em;
  }
`);

const contentcss = css`
  p {
    display: block;
    margin-block-end: 0.75em;
    line-height: 1.5;
  }
  p:where(:lang(zh), :lang(ja), :lang(kr)) {
    line-height: 1.7;
  }
  :where(img, p:has(img), a[href$='zip']) {
    display: none;
  }
`;

/**
 * @customElement m-game-detail
 */
@customElement('m-game-detail')
@adoptedStyle(style)
export class MGameDetailElement extends GemElement {
  @attribute md: string;

  render = () => {
    return html`<dy-unsafe .content=${marked.parse(this.md)} .contentcss=${contentcss}></dy-unsafe>`;
  };
}
