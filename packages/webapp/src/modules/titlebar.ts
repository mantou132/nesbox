import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, connectStore } from '@mantou/gem';

import { i18n } from 'src/i18n';
import { theme, updatePartialTheme } from 'src/theme';

import 'duoyun-ui/elements/title';

const style = createCSSSheet(css``);

/**
 * @customElement m-titlebar
 */
@customElement('m-titlebar')
@adoptedStyle(style)
@connectStore(i18n.store)
export class MTitlebarElement extends GemElement {
  constructor() {
    super();
    this.addEventListener('mousedown', () => {
      window.__TAURI__?.window.appWindow.startDragging();
    });
    this.addEventListener('dblclick', async () => {
      window.__TAURI__?.window.appWindow.toggleMaximize();
    });
    updatePartialTheme({ titleBarHeight: this.style.height });
  }

  render = () => {
    return html`
      <style>
        :host {
          -webkit-user-select: none;
          user-select: none;
          display: flex;
          align-items: center;
          justify-content: center;
          height: ${theme.titleBarHeight};
          background-color: black;
          text-align: center;
          font-size: 0.75em;
          font-weight: bolder;
          z-index: calc(${theme.popupZIndex} + 1);
        }
      </style>
      <dy-title suffix=${` | ${i18n.get('title')}`}></dy-title>
    `;
  };
}
