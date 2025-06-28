import {
  adoptedStyle,
  connectStore,
  createState,
  css,
  customElement,
  GemElement,
  history,
  html,
  mounted,
} from '@mantou/gem';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { getWebManifestURL } from 'duoyun-ui/helper/webapp';
import { configure, navStore } from 'src/configure';
import { canonicalOrigin, isSafari } from 'src/constants';
import { i18n } from 'src/i18n/basic';
import { themeStore } from 'src/theme';

import 'duoyun-ui/elements/reflect';
import 'duoyun-ui/elements/title';

const style = css`
  :scope {
    display: none;
  }
`;

@customElement('m-meta')
@connectStore(themeStore)
@connectStore(navStore)
@connectStore(history.store)
@adoptedStyle(style)
export class ModuleMetaElement extends GemElement {
  #state = createState({ manifest: undefined as string | undefined });

  @mounted()
  #init = () => {
    addEventListener('load', async () => {
      const { genWebManifest } = await import('src/webmanifest');
      this.effect(
        () => this.#state({ manifest: getWebManifestURL(genWebManifest()) }),
        () => [i18n.currentLanguage, configure.theme],
      );
    });
  };

  render = () => {
    const { manifest } = this.#state;
    return html`
      <dy-title suffix=${mediaQuery.isPWA ? '' : ` - ${i18n.get('global.title')}`}></dy-title>
      <dy-reflect>
        <meta
          name="theme-color"
          content=${navStore.room ? '#000' : isSafari ? themeStore.backgroundColor : themeStore.titleBarColor}
        />
        <meta name="description" content=${i18n.get('global.sloganDesc')} />
        <link rel="canonical" href=${`${canonicalOrigin}${history.getParams().path}`} />
        <link v-if=${!!manifest} rel="manifest" href=${manifest} />
      </dy-reflect>
    `;
  };
}
