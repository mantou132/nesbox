import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  numattribute,
} from '@mantou/gem';

import { ScFriendStatus } from 'src/generated/graphql';
import { friendStore } from 'src/store';
import { theme } from 'src/theme';

const style = createCSSSheet(css`
  :host {
    position: absolute;
    right: 0;
    top: 0;
    background: ${theme.noticeColor};
    border-radius: 10em;
    width: 1.5em;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75em;
  }
  :host([friendid]) {
    position: static;
  }
  :host([hidden]) {
    display: none;
  }
`);

/**
 * @customElement m-badge
 */
@customElement('m-badge')
@adoptedStyle(style)
@connectStore(friendStore)
export class MBadgeElement extends GemElement {
  @numattribute friendid: number;

  render = () => {
    const count = this.friendid
      ? friendStore.friends[this.friendid]?.unreadMessageCount || 0
      : (friendStore.inviteIds?.length || 0) +
        (friendStore.friendIds?.reduce(
          (p, id) =>
            p +
            (friendStore.friends[id]?.status === ScFriendStatus.Pending
              ? 1
              : Number(friendStore.friends[id]?.unreadMessageCount)),
          0,
        ) || 0);

    this.hidden = !count;

    return html`${count}`;
  };
}
