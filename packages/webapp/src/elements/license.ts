import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  useStore,
} from '@mantou/gem';

import { getCorSrc } from 'src/utils/common';

import 'duoyun-ui/elements/loading';

const [store, update] = useStore({ license: '' });

const style = createCSSSheet(css`
  :host {
    white-space: pre-wrap;
  }
`);
/**
 * @customElement nesbox-license
 */
@customElement('nesbox-license')
@connectStore(store)
@adoptedStyle(style)
export class NesboxLicenseElement extends GemElement {
  mounted = () => {
    fetch(getCorSrc('https://raw.githubusercontent.com/mantou132/nesbox/dev/LICENSE'))
      .then((res) => res.text())
      .then((license) => {
        update({
          license: license
            .split(/\n{2,}/)
            .map((line) => line.replaceAll('\n', ' '))
            .join('\n\n'),
        });
      });
  };

  render = () => {
    if (!store.license) return html`<dy-loading></dy-loading>`;
    return html`${store.license}`;
  };
}
