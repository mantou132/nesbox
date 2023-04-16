import { GemElement, html, adoptedStyle, customElement, createCSSSheet, css, property } from '@mantou/gem';

import { GameAttributes } from 'src/store';
import { theme } from 'src/theme';
import { icons } from 'src/icons';

import 'duoyun-ui/elements/link';
import 'duoyun-ui/elements/tag';
import 'duoyun-ui/elements/use';

const style = createCSSSheet(css`
  :host {
    display: block;
  }
  .text-ad {
    font-size: 0.875em;
    display: flex;
    align-items: center;
    gap: 0.4em;
    padding: 0.5em 1em;
    border-radius: ${theme.normalRound};
    border: 1px solid ${theme.borderColor};
  }
  .link {
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    max-width: 10em;
  }
  .icon {
    width: 1em;
  }
`);

const getLink = (src = '') => {
  try {
    const url = new URL(src);
    url.searchParams.append('utm_source', 'nesbox');
    return url.href;
  } catch {
    return '';
  }
};

/**
 * @customElement m-ads
 */
@customElement('m-ads')
@adoptedStyle(style)
export class MAdsElement extends GemElement {
  @property attrs?: GameAttributes;

  render = () => {
    const { ad_link, ad_text } = this.attrs || {};
    const link = getLink(ad_link);

    if (link) {
      return html`
        <dy-link class="text-ad" href=${link}>
          <dy-tag small>AD</dy-tag>
          <span class="link">${ad_text || ad_link}</span>
          <dy-use class="icon" .element=${icons.openNewWindow}></dy-use>
        </dy-link>
      `;
    }

    return html``;
  };
}
