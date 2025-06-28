import { connectStore, customElement, effect, state } from '@mantou/gem';
import { DuoyunActiveLinkElement } from 'duoyun-ui/elements/link';
import { locationStore } from 'src/routes';

@customElement('nesbox-nav-link')
@connectStore(locationStore)
export class NesboxNavLinkElement extends DuoyunActiveLinkElement {
  @state match: boolean;

  @effect(() => [locationStore.path])
  #update = () => (this.match = this.active);
}
