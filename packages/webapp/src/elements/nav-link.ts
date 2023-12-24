import { connectStore, customElement, state } from '@mantou/gem';
import { DuoyunActiveLinkElement } from 'duoyun-ui/elements/link';
import { locationStore } from 'src/routes';

/**
 * @customElement nesbox-nav-link
 */
@customElement('nesbox-nav-link')
@connectStore(locationStore)
export class NesboxNavLinkElement extends DuoyunActiveLinkElement {
  @state match: boolean;

  constructor() {
    super();
    this.effect(
      () => (this.match = this.active),
      () => [locationStore.path],
    );
  }
}
