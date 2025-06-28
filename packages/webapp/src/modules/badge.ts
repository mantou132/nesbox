import { adoptedStyle, connectStore, css, customElement, GemElement, html, numattribute } from '@mantou/gem';
import { ScFriendStatus, ScUserStatus } from 'src/generated/graphql';
import { friendStore } from 'src/store';
import { theme } from 'src/theme';

const style = css`
  :scope {
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
  :scope[friendid] {
    position: static;
  }
  :scope[hidden] {
    display: none;
  }
`;

@customElement('m-badge')
@adoptedStyle(style)
@connectStore(friendStore)
export class MBadgeElement extends GemElement {
  @numattribute friendid: number;

  render = () => {
    const count = this.friendid
      ? friendStore.friends[this.friendid]?.unreadMessageCount || 0
      : (friendStore.inviteIds?.reduce(
          (p, id) =>
            p +
            (friendStore.friends[friendStore.invites[id]?.userId || 0]?.user.status === ScUserStatus.Offline ? 0 : 1),
          0,
        ) || 0) +
        (friendStore.friendIds?.reduce(
          (p, id) =>
            p +
            (friendStore.friends[id]?.status === ScFriendStatus.Pending
              ? 1
              : Number(friendStore.friends[id]?.unreadMessageCount)),
          0,
        ) || 0);

    this.hidden = !count;

    navigator.setAppBadge?.(count);

    return html`${count}`;
  };
}
