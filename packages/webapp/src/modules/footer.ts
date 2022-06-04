import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css } from '@mantou/gem';

import { theme } from 'src/theme';

const style = createCSSSheet(css`
  :host {
    display: contents;
  }
  footer {
    margin-block-start: ${theme.gridGutter};
    padding: ${theme.gridGutter};
    text-align: center;
  }
`);

/**
 * @customElement m-footer
 */
@customElement('m-footer')
@adoptedStyle(style)
export class MFooterElement extends GemElement {
  render = () => {
    return html`<footer>NESBox © Copyright</footer>`;
  };
}
