import { adoptedStyle, css, customElement, GemElement, html, property } from '@mantou/gem';
import { isMtApp } from '@nesbox/mtapp';
import { marked } from 'marked';
import type { Game } from 'src/store';

import 'duoyun-ui/elements/button';
import 'duoyun-ui/elements/unsafe';
import 'duoyun-ui/elements/use';
import 'duoyun-ui/elements/more';
import 'duoyun-ui/elements/empty';

const style = css`
  :scope {
    display: block;
    flex-grow: 1;
  }
`;

const contentCSS = /*css*/ `
  p:first-of-type {
    margin-block-start: 0;
  }
  p {
    display: block;
    margin-block-end: 0.75em;
    line-height: 1.7;
  }
  p:where(:lang(zh), :lang(ja), :lang(kr)) {
    text-align: justify;
  }
`;

@customElement('m-game-detail')
@adoptedStyle(style)
export class MGameDetailElement extends GemElement {
  @property game?: Game;

  #domParse = new DOMParser();

  render = () => {
    const doc = this.#domParse.parseFromString(marked.parse(this.game?.description || ''), 'text/html');
    doc.querySelectorAll(`:where(img, a[href$='zip'])`).forEach((e) => e.remove());
    doc.querySelectorAll('p').forEach((p) => {
      if (!p.textContent?.trim()) {
        p.remove();
      }
    });

    if (!doc.body.textContent?.trim()) return html`<dy-empty></dy-empty>`;

    return html`
      <dy-more .maxheight=${isMtApp ? 'Infinity' : ''}>
        <dy-unsafe .html=${doc.body.innerHTML} .styles=${contentCSS}></dy-unsafe>
      </dy-more>
    `;
  };
}
