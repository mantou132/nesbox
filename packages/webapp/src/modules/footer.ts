import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css } from '@mantou/gem';

import { theme } from 'src/theme';

import 'duoyun-ui/elements/divider';

const style = createCSSSheet(css`
  :host {
    display: block;
    margin-block-start: ${theme.gridGutter};
    padding-inline: ${theme.gridGutter};
  }
  footer {
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
    return html`
      <dy-divider></dy-divider>
      <footer>NESBox © Copyright</footer>
    `;
  };
}
