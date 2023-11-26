import { GemElement, html, adoptedStyle, createCSSSheet, css, customElement, connectStore, history } from '@mantou/gem';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';

import { i18n } from 'src/i18n/basic';
import { themeStore } from 'src/theme';
import { canonicalOrigin, isSafari } from 'src/constants';
import { navStore } from 'src/configure';

import 'duoyun-ui/elements/title';
import 'duoyun-ui/elements/reflect';

const style = createCSSSheet(css`
  :host {
    display: none;
  }
`);

/**
 * @customElement m-meta
 */
@customElement('m-meta')
@connectStore(themeStore)
@connectStore(navStore)
@connectStore(i18n.store)
@connectStore(history.store)
@adoptedStyle(style)
export class ModuleMetaElement extends GemElement {
  render = () => {
    return html`
      <dy-title suffix=${mediaQuery.isPWA ? '' : ` - ${i18n.get('global.title')}`}></dy-title>
      <dy-reflect>
        <meta
          name="theme-color"
          content=${navStore.room ? '#000' : isSafari ? themeStore.backgroundColor : themeStore.titleBarColor}
        />
        <meta name="description" content=${i18n.get('global.sloganDesc')} />
        <link rel="canonical" href=${`${canonicalOrigin}${history.getParams().path}`} />
      </dy-reflect>
    `;
  };
}
