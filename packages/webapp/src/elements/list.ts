import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, property } from '@mantou/gem';
import { commonHandle } from 'duoyun-ui/lib/hotkeys';
import { focusStyle } from 'duoyun-ui/lib/styles';

import { theme } from 'src/theme';

import 'duoyun-ui/elements/tag';

const style = createCSSSheet(css`
  ul {
    width: min(80vw, 20em);
    min-height: 10em;
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  li {
    cursor: default;
    display: flex;
    gap: 1em;
    align-items: center;
    border-radius: ${theme.normalRound};
    overflow: hidden;
  }
  li:hover {
    background: ${theme.hoverBackgroundColor};
  }
  img {
    border-radius: ${theme.normalRound};
    width: 64px;
  }
`);

/**
 * @customElement nesbox-list
 */
@customElement('nesbox-list')
@adoptedStyle(style)
@adoptedStyle(focusStyle)
export class NesboxListElement extends GemElement {
  @property data: { img: string; label: string; tag: string; onClick: (evt: PointerEvent) => void | Promise<void> }[];
  render = () => {
    return html`
      <ul>
        ${this.data.map(
          ({ img, label, tag, onClick }) => html`
            <li @click=${onClick} tabindex="0" @keydown=${commonHandle}>
              <img draggable="false" src=${img} alt="" />
              <span>${label}</span>
              ${tag && html`<dy-tag small color="notice">${tag}</dy-tag>`}
            </li>
          `,
        )}
      </ul>
    `;
  };
}
