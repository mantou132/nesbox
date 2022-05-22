import { GemElement, html, adoptedStyle, createCSSSheet, css, customElement } from '@mantou/gem';

import { i18n } from 'src/i18n';

import '@mantou/gem/elements/title';

const style = createCSSSheet(css`
  :host {
    display: none;
  }
`);

@customElement('m-meta')
@adoptedStyle(style)
export class ModuleMetaElement extends GemElement {
  render = () => {
    return html`<gem-title suffix=${` | ${i18n.get('title')}`}></gem-title>`;
  };
}
