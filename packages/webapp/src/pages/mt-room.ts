import {
  addListener,
  adoptedStyle,
  connectStore,
  createRef,
  css,
  customElement,
  effect,
  history,
  html,
  mounted,
} from '@mantou/gem';
import { DuoyunWakeLockBaseElement } from 'duoyun-ui/elements/base/wake-lock';
import { createPath, matchPath } from 'duoyun-ui/elements/route';
import { waitLoading } from 'duoyun-ui/elements/wait';
import { configure } from 'src/configure';
import { globalEvents, queryKeys } from 'src/constants';
import { GamepadBtnIndex } from 'src/gamepad';
import type { MVoiceRoomElement } from 'src/modules/room-voice';
import type { MStageElement } from 'src/modules/stage';
import { mtAppStore } from 'src/mt-app';
import { routes } from 'src/routes';
import { leaveRoom, updateRoomScreenshot } from 'src/services/api';
import { store } from 'src/store';
import { theme } from 'src/theme';
import { playHintSound } from 'src/utils/common';

import 'duoyun-ui/elements/space';
import 'src/elements/fps';
import 'src/elements/ping';
import 'src/modules/room-voice';
import 'src/modules/stage';

const style = css`
  .stage {
    position: absolute;
    inset: 0;
  }
  .info {
    position: absolute;
    right: 1rem;
    top: 1rem;
  }
  .icon {
    display: inline-flex;
    width: 1.3em;
    padding: 0.2em;
    border-radius: ${theme.smallRound};
  }
`;

@customElement('p-mt-room')
@connectStore(store)
@connectStore(configure)
@adoptedStyle(style)
export class PMtRoomElement extends DuoyunWakeLockBaseElement {
  #stageRef = createRef<MStageElement>();
  #voiceRef = createRef<MVoiceRoomElement>();

  get #playing() {
    return configure.user?.playing;
  }

  #uploadScreenshot = async () => {
    if (!this.#stageRef.value!.hostRomBuffer) return;
    updateRoomScreenshot({
      id: this.#playing!.id,
      screenshot: await this.#stageRef.value!.getThumbnail(),
    });
  };

  #onPressButtonIndex = ({ detail }: CustomEvent<GamepadBtnIndex>) => {
    switch (detail) {
      case GamepadBtnIndex.FrontLeftTop:
        playHintSound();
        waitLoading(leaveRoom());
        break;
      case GamepadBtnIndex.FrontRightTop:
        playHintSound();
        // TODO: settings
        this.#voiceRef.value?.toggleVoice();
        break;
    }
  };

  @mounted()
  #init = () => {
    mtAppStore({ inertNav: true });
    const handle1 = addListener(window, globalEvents.PRESS_HOST_BUTTON_INDEX, this.#onPressButtonIndex);
    const handle = addListener(this, 'dblclick', () => waitLoading(leaveRoom()));
    return () => {
      mtAppStore({ inertNav: false });
      handle1();
      handle();
    };
  };

  @effect((i) => [i.#playing])
  #updatePath = () => {
    if (configure.user && !this.#playing) {
      const roomFrom = history.getParams().query.get(queryKeys.ROOM_FROM) || '';
      const { pathname, search } = new URL(roomFrom, location.origin);
      const returnPath = roomFrom && [routes.rooms, routes.games].some((route) => matchPath(route.pattern, pathname));
      history.replace({ path: returnPath ? pathname : createPath(routes.games), query: search || undefined });
    } else {
      const timer = window.setInterval(this.#uploadScreenshot, 10000);
      return () => {
        clearInterval(timer);
      };
    }
  };

  render = () => {
    return html`
      <m-stage ${this.#stageRef} class="stage"  .padding=${'2em 0 5em'}></m-stage>
      <dy-space class="info">
        <nesbox-fps v-if=${this.#playing?.host === configure.user?.id}></nesbox-fps>
        <nesbox-ping v-else></nesbox-ping>
        <m-room-voice ${this.#voiceRef} class="icon" ></m-room-voice>
      </dy-space>
    `;
  };
}
