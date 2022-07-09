import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, property } from '@mantou/gem';

import { theme } from 'src/theme';

const style = createCSSSheet(css`
  ul {
    width: min(80vw, 20em);
    min-height: 10em;
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 1px;
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
export class NesboxListElement extends GemElement {
  @property data: { img: string; label: string; onClick: (evt: PointerEvent) => void }[];
  render = () => {
    return html`
      <ul>
        ${this.data.map(
          ({ img, label, onClick }) => html`
            <li @click=${onClick}>
              <img src=${img} alt="" />
              <span>${label}</span>
            </li>
          `,
        )}
      </ul>
    `;
  };
}
