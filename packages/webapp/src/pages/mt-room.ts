import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  RefObject,
  refobject,
  connectStore,
  history,
} from '@mantou/gem';
import { createPath, matchPath } from 'duoyun-ui/elements/route';
import { waitLoading } from 'duoyun-ui/elements/wait';
import { mtApp } from 'mt-app';

import { configure } from 'src/configure';
import type { MNesElement } from 'src/modules/nes';
import { routes } from 'src/routes';
import { leaveRoom, updateRoomScreenshot } from 'src/services/api';
import { store } from 'src/store';
import { events, queryKeys } from 'src/constants';
import { GamepadBtnIndex } from 'src/gamepad';
import type { MVoiceRoomElement } from 'src/modules/room-voice';

import 'duoyun-ui/elements/space';
import 'src/modules/nes';
import 'src/modules/room-voice';
import 'src/elements/fps';
import 'src/elements/ping';

const style = createCSSSheet(css`
  .nes {
    position: absolute;
    inset: 0;
  }
  .nes::part(canvas) {
    padding-block-start: 2em;
  }
  .info {
    position: absolute;
    right: 1rem;
    top: 1rem;
  }
`);

/**
 * @customElement p-mt-room
 */
@customElement('p-mt-room')
@connectStore(store)
@connectStore(configure)
@adoptedStyle(style)
export class PMtRoomElement extends GemElement {
  @refobject nesbox: RefObject<MNesElement>;
  @refobject voice: RefObject<MVoiceRoomElement>;

  get #playing() {
    return configure.user?.playing;
  }

  constructor() {
    super();
    this.addEventListener('dblclick', () => {
      waitLoading(leaveRoom());
    });
  }

  #uploadScreenshot = () => {
    if (!this.nesbox.element!.romBuffer) return;
    updateRoomScreenshot({
      id: this.#playing!.id,
      screenshot: this.nesbox.element!.getThumbnail(),
    });
  };

  #onPressButtonIndex = ({ detail }: CustomEvent<GamepadBtnIndex>) => {
    switch (detail) {
      case GamepadBtnIndex.FrontLeftTop:
        mtApp.playSound('click');
        waitLoading(leaveRoom());
        break;
      case GamepadBtnIndex.FrontRightTop:
        mtApp.playSound('click');
        this.voice.element?.toggleVoice();
        break;
    }
  };

  mounted = () => {
    this.effect(
      () => {
        if (configure.user && !this.#playing) {
          const roomFrom = history.getParams().query.get(queryKeys.ROOM_FROM) || '';
          const { pathname, search } = new URL(roomFrom, location.origin);
          const returnPath =
            roomFrom && [routes.rooms, routes.games].some((route) => matchPath(route.pattern, pathname));
          history.replace({ path: returnPath ? pathname : createPath(routes.games), query: search || undefined });
        } else {
          const timer = window.setInterval(this.#uploadScreenshot, 10000);
          return () => {
            clearInterval(timer);
          };
        }
      },
      () => [this.#playing],
    );

    addEventListener(events.PRESS_BUTTON_INDEX, this.#onPressButtonIndex);
    return () => {
      removeEventListener(events.PRESS_BUTTON_INDEX, this.#onPressButtonIndex);
    };
  };

  render = () => {
    return html`
      <m-nes class="nes" ref=${this.nesbox.ref}></m-nes>

      <dy-space class="info">
        ${this.#playing?.host === configure.user?.id
          ? html`<nesbox-fps></nesbox-fps>`
          : html`<nesbox-ping></nesbox-ping>`}
        <m-room-voice ref=${this.voice.ref}></m-room-voice>
      </dy-space>
    `;
  };
}
