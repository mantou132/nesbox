import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css } from '@mantou/gem';

const style = createCSSSheet(css``);

/**
 * @customElement app-root
 */
@customElement('app-root')
@adoptedStyle(style)
export class AppRootElement extends GemElement {
  render = () => {
    return html`app-root`;
  };
}
