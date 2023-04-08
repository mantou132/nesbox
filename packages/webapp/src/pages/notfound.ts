import { GemElement, html, customElement, connectStore } from '@mantou/gem';
import { routes } from 'src/routes';

import { i18n } from 'src/i18n/basic';
import notfound from 'src/images/notfound.svg?raw';

import type { RouteItem } from '@mantou/gem/elements/route';

import 'duoyun-ui/elements/result';
import 'duoyun-ui/elements/link';

@customElement('p-notfound')
@connectStore(i18n.store)
export class PageNotfoundElement extends GemElement {
  render = () => {
    return html`
      <dy-result
        style="height: 60vh"
        .illustrator=${notfound}
        .header=${i18n.get('notFoundTitle')}
        .description=${i18n.get(
          'notFoundDetail',
          (text) => html`<dy-link .route=${routes.home as RouteItem}>${text}</dy-link>`,
        )}
      >
      </dy-result>
    `;
  };
}
