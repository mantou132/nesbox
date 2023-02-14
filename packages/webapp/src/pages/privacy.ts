import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css } from '@mantou/gem';

import 'duoyun-ui/elements/paragraph';
import 'duoyun-ui/elements/heading';

const style = createCSSSheet(css`
  :host {
    display: flex;
    flex-direction: column;
    height: 80vh;
    align-items: center;
    width: min(90vw, 45em);
    margin: auto;
    text-align: center;
  }
`);

/**
 * @customElement p-privacy
 */
@customElement('p-privacy')
@adoptedStyle(style)
export class PPrivacyElement extends GemElement {
  render = () => {
    return html`
      <dy-heading>Privacy</dy-heading>
      <dy-paragraph>
        NESBox's server will save your registered account and your favorite game list, and NESBox guarantees that it
        will not review and disclose these information. Apart from this, NESBox will not collect and request any other
        personal data from you.
      </dy-paragraph>
    `;
  };
}
