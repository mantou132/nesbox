import { customElement, GemElement, html } from '@mantou/gem';
import type { RouteItem } from '@mantou/gem/elements/route';
import { i18n } from 'src/i18n/basic';
import notfound from 'src/images/notfound.svg?raw';
import { routes } from 'src/routes';

import 'duoyun-ui/elements/link';
import 'duoyun-ui/elements/result';

@customElement('p-notfound')
export class PageNotfoundElement extends GemElement {
  render = () => {
    return html`
      <dy-result
        style="height: 60vh"
        .illustrator=${notfound}
        .header=${i18n.get('page.notFound.title')}
        .description=${i18n.get(
          'page.notFound.detail',
          (text) => html`<dy-link .route=${routes.home as RouteItem}>${text}</dy-link>`,
        )}
      >
      </dy-result>
    `;
  };
}
