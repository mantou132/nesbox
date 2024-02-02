import { GemElement, html, adoptedStyle, createCSSSheet, css, customElement, connectStore, history } from '@mantou/gem';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { getWebManifestURL } from 'duoyun-ui/helper/webapp';

import { i18n } from 'src/i18n/basic';
import { themeStore } from 'src/theme';
import { canonicalOrigin, isSafari } from 'src/constants';
import { configure, navStore } from 'src/configure';

import 'duoyun-ui/elements/title';
import 'duoyun-ui/elements/reflect';

const style = createCSSSheet(css`
  :host {
    display: none;
  }
`);

type State = {
  manifest?: string;
};

/**
 * @customElement m-meta
 */
@customElement('m-meta')
@connectStore(themeStore)
@connectStore(navStore)
@connectStore(i18n.store)
@connectStore(history.store)
@adoptedStyle(style)
export class ModuleMetaElement extends GemElement<State> {
  state: State = {};
  mounted = () => {
    addEventListener('load', async () => {
      const { genWebManifest } = await import('src/webmanifest');
      this.effect(
        () => {
          this.setState({ manifest: getWebManifestURL(genWebManifest()) });
        },
        () => [i18n.currentLanguage, configure.theme],
      );
    });
  };

  render = () => {
    const { manifest } = this.state;
    return html`
      <dy-title suffix=${mediaQuery.isPWA ? '' : ` - ${i18n.get('global.title')}`}></dy-title>
      <dy-reflect>
        <meta
          name="theme-color"
          content=${navStore.room ? '#000' : isSafari ? themeStore.backgroundColor : themeStore.titleBarColor}
        />
        <meta name="description" content=${i18n.get('global.sloganDesc')} />
        <link rel="canonical" href=${`${canonicalOrigin}${history.getParams().path}`} />
        ${manifest ? html`<link rel="manifest" href=${manifest} />` : ''}
      </dy-reflect>
    `;
  };
}
