import {
  addListener,
  adoptedStyle,
  boolattribute,
  connectStore,
  css,
  customElement,
  GemElement,
  html,
  mounted,
  QueryString,
} from '@mantou/gem';
import type { DuoyunActiveLinkElement } from 'duoyun-ui/elements/link';
import { createPath } from 'duoyun-ui/elements/route';
import { configure } from 'src/configure';
import { globalEvents, queryKeys } from 'src/constants';
import { GamepadBtnIndex } from 'src/gamepad';
import { i18n } from 'src/i18n/basic';
import { routes } from 'src/routes';
import { theme } from 'src/theme';
import { getAvatar, playHintSound } from 'src/utils/common';

import 'duoyun-ui/elements/avatar';
import 'duoyun-ui/elements/link';
import 'src/elements/battery';
import 'src/elements/net';
import 'src/elements/time';

const style = css`
  :scope {
    position: relative;
    display: flex;
    place-items: center;
    place-content: space-between;
    padding: calc(1.2 * ${theme.gridGutter}) calc(2 * ${theme.gridGutter});
    font-size: 0.875em;
  }
  .user {
    display: grid;
    place-items: center;
    grid-template: 'avatar nickname' 1fr;
  }
  .avatar {
    grid-area: avatar;
    margin-inline-end: 0.5em;
  }
  .avatar::part(avatar) {
    background: ${theme.describeColor};
  }
  .links {
    position: absolute;
    display: flex;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    gap: 2vw;
    transition: all 0.3s ${theme.timingFunction};
  }
  :scope[inert] .links {
    opacity: 0;
  }
  .link {
    padding: 0.4em 1em;
    opacity: 0.5;
    outline: none;
  }
  .link:state(active) {
    opacity: 1;
  }
  .status {
    display: flex;
    place-items: center;
    gap: 0.5em;
  }
`;

@customElement('m-mt-nav')
@adoptedStyle(style)
@connectStore(configure)
export class MMtNavElement extends GemElement {
  @boolattribute inert: boolean;

  get #links() {
    return [
      { path: createPath(routes.games), text: i18n.get('page.favorites.title') },
      {
        path: createPath(routes.games),
        query: new QueryString({ [queryKeys.RECENT_GAMES]: '1' }).toString(),
        text: i18n.get('page.games.recent'),
      },
      { path: createPath(routes.rooms), text: i18n.get('page.rooms.title') },
    ];
  }

  #onPressButtonIndex = ({ detail }: CustomEvent<GamepadBtnIndex>) => {
    if (this.inert) return;
    const links = [...(this.querySelectorAll<DuoyunActiveLinkElement>('dy-active-link') || [])];
    const index = links.findIndex((e) => e.active);
    switch (detail) {
      case GamepadBtnIndex.FrontLeftBottom:
        playHintSound();
        links[(index - 1 + links.length) % links.length].click();
        break;
      case GamepadBtnIndex.FrontRightBottom:
        playHintSound();
        links[(index + 1 + links.length) % links.length].click();
        break;
    }
  };

  @mounted()
  #init = () => addListener(window, globalEvents.PRESS_HOST_BUTTON_INDEX, this.#onPressButtonIndex);

  render = () => {
    return html`
      <div class="user">
        <dy-avatar class="avatar" src=${getAvatar(configure.user?.username)}></dy-avatar>
        <span class="nickname">${configure.user?.nickname}</span>
      </div>
      <div class="links">
        ${this.#links.map(
          ({ path, text, query = '' }) =>
            html`<dy-active-link class="link" .path=${path} .query=${query} .docTitle=${text}>${text}</dy-active-link>`,
        )}
      </div>
      <div class="status">
        <nesbox-net class="net"></nesbox-net>
        <nesbox-battery class="battery"></nesbox-battery>
        <nesbox-time class="time"></nesbox-time>
      </div>
    `;
  };
}
