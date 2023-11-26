import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  history,
  refobject,
  RefObject,
  QueryString,
} from '@mantou/gem';
import { createPath, matchPath } from 'duoyun-ui/elements/route';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { ContextMenu } from 'duoyun-ui/elements/menu';
import { Modal } from 'duoyun-ui/elements/modal';
import { DuoyunInputElement } from 'duoyun-ui/elements/input';
import { isNotBoolean } from 'duoyun-ui/lib/types';
import { Toast } from 'duoyun-ui/elements/toast';
import { hash } from 'duoyun-ui/lib/encode';
import { Time } from 'duoyun-ui/lib/time';
import { getStringFromTemplate, once } from 'duoyun-ui/lib/utils';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { routes } from 'src/routes';
import { locale } from 'duoyun-ui/lib/locale';

import { preventDefault } from 'src/utils/common';
import { BcMsgEvent, BcMsgType, queryKeys } from 'src/constants';
import { configure, getShortcut } from 'src/configure';
import { friendStore, store } from 'src/store';
import { i18n } from 'src/i18n/basic';
import { createInvite, updateRoomScreenshot } from 'src/services/api';
import { closeListenerSet } from 'src/elements/titlebar';
import { logger } from 'src/logger';
import { ScUserStatus } from 'src/generated/graphql';
import { theme } from 'src/theme';
import { mountedRoom, unmountedRoom } from 'src/modules/nav';
import { wakeLock } from 'src/effects/wake-lock';

import type { MStageElement } from 'src/modules/stage';

import 'duoyun-ui/elements/coach-mark';
import 'duoyun-ui/elements/space';
import 'duoyun-ui/elements/status-light';
import 'src/modules/stage';
import 'src/modules/room-recorder';
import 'src/modules/room-voice';
import 'src/modules/ads';
import 'src/modules/cheat-settings';
import 'src/modules/combo-settings';
import 'src/elements/list';
import 'src/elements/fps';
import 'src/elements/ping';

const style = createCSSSheet(css`
  .stage {
    position: absolute;
    inset: 0;
  }
  .coach-mark-container {
    position: absolute;
    top: 40%;
    right: 15em;
    width: 1px;
    height: 1px;
  }
  .ads {
    position: absolute;
    right: ${theme.gridGutter};
    top: 1em;
  }
  .info {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
  }
  .icon {
    display: inline-flex;
    width: 1.3em;
    padding: 0.2em;
    border-radius: ${theme.smallRound};
  }
  .icon:hover {
    background: ${theme.lightBackgroundColor};
  }
`);

/**
 * @customElement p-room
 */
@customElement('p-room')
@connectStore(store)
@connectStore(configure)
@adoptedStyle(style)
@connectStore(i18n.store)
export class PRoomElement extends GemElement {
  @refobject stageRef: RefObject<MStageElement>;

  get #playing() {
    return configure.user?.playing;
  }

  get #game() {
    return store.games[this.#playing?.gameId || 0];
  }

  get #isHost() {
    return configure.user?.id === this.#playing?.host;
  }

  #onContextMenu = (event: MouseEvent) => {
    event.preventDefault();
    if (!this.#playing) return;
    ContextMenu.open(
      [
        !!friendStore.friendIds?.length && {
          text: i18n.get('page.friend.inviteValid'),
          menu: friendStore.friendIds?.map((id) => ({
            text: friendStore.friends[id]?.user.nickname || '',
            tag:
              friendStore.friends[id]?.user.status === ScUserStatus.Online
                ? html`<dy-status-light status="positive"></dy-status-light>`
                : undefined,
            handle: () => createInvite({ roomId: this.#playing!.id, targetId: id }),
          })),
        },
        {
          text: i18n.get('page.friend.invite'),
          handle: async () => {
            const input = await Modal.open<DuoyunInputElement>({
              header: i18n.get('page.friend.invite'),
              body: html`
                <dy-input
                  autofocus
                  style="width: 100%"
                  placeholder=${i18n.get('placeholder.username')}
                  @change=${(e: any) => (e.target.value = e.detail)}
                ></dy-input>
              `,
            });
            createInvite({ roomId: this.#playing!.id, targetId: 0, tryUsername: input.value });
          },
        },
        {
          text: i18n.get('menu.game.share'),
          handle: () => {
            const url = `${location.origin}${createPath(routes.games)}${new QueryString({
              [queryKeys.JOIN_ROOM]: this.#playing!.id,
            })}`;
            navigator.share
              ? navigator
                  .share({
                    url,
                    text: getStringFromTemplate(
                      i18n.get('menu.game.shareDesc', store.games[this.#playing!.gameId]?.name || ''),
                    ),
                  })
                  .catch(() => {
                    //
                  })
              : navigator.clipboard.writeText(url).then(() => Toast.open('success', locale.copySuccess));
          },
        },
        {
          text: '---',
        },
        {
          text: i18n.get('menu.game.screenshot'),
          handle: this.#saveScreenshot,
          tag: getShortcut('SCREENSHOT', true),
        },
        this.#isHost && {
          text: i18n.get('menu.game.stateSave') + ' (Local)',
          handle: this.#save,
          tag: getShortcut('SAVE_GAME_STATE', true),
        },
        this.#isHost && {
          text: i18n.get('menu.game.loadState') + ' (Local)',
          handle: this.#load,
          tag: getShortcut('LOAD_GAME_STATE', true),
        },
        this.#isHost && {
          text: i18n.get('menu.game.openRam'),
          handle: this.#openRamViewer,
          tag: getShortcut('OPEN_RAM_VIEWER', true),
        },
        this.#isHost && {
          text: i18n.get('menu.game.openCheat'),
          handle: this.#openCheatModal,
          tag: getShortcut('OPEN_CHEAT_SETTINGS', true),
        },
        this.#isHost && {
          text: i18n.get('menu.game.openCombo'),
          handle: this.#openComboModal,
        },
      ].filter(isNotBoolean),
      {
        x: event.clientX,
        y: event.clientY,
      },
    );
  };

  #getCachesName = (auto: boolean) => `${auto ? 'auto_v1_' : ''}state_v7`;

  #save = async (auto = false) => {
    try {
      if (!this.stageRef.element!.hostRomBuffer) return;
      const state = await this.stageRef.element!.getState();
      if (!state) return;
      const thumbnail = await this.stageRef.element!.getThumbnail();
      const cache = await caches.open(this.#getCachesName(auto));
      const key = await hash(this.stageRef.element!.hostRomBuffer);
      await cache.put(
        `/${key}?${new URLSearchParams({
          type: state.type,
          ptr: state.ptr || '',
          timestamp: Date.now().toString(),
          thumbnail,
          auto: auto ? 'auto' : '',
        })}`,
        new Response(state.buffer, {
          headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': state.buffer.byteLength.toString(),
          },
        }),
      );
    } catch (err) {
      logger.error(err);
      if (!auto) throw err;
    }
    if (!auto) Toast.open('success', i18n.get('tip.game.stateSave', new Time().format()));
  };

  #autoSave = () => {
    this.#save(true);
  };

  #load = async () => {
    if (!this.stageRef.element!.hostRomBuffer) return;
    const key = await hash(this.stageRef.element!.hostRomBuffer);
    const cache = await caches.open(this.#getCachesName(false));
    const reqList = [...(await cache.keys(`/${key}`, { ignoreSearch: true }))].splice(0, 10);
    const autoCache = await caches.open(this.#getCachesName(true));
    const autoCacheReqList = await autoCache.keys(`/${key}`, { ignoreSearch: true });
    const autoCacheReq = autoCacheReqList[autoCacheReqList.length - 1];
    if (autoCacheReq) {
      reqList.unshift(autoCacheReq);
    }
    if (reqList.length === 0) {
      Toast.open('default', i18n.get('tip.game.stateMissing'));
    } else {
      const getQuery = (url: string, { searchParams } = new URL(url)) => ({
        type: searchParams.get('type') || '',
        ptr: searchParams.get('ptr') || '',
        time: new Time(Number(searchParams.get('timestamp'))),
        thumbnail: searchParams.get('thumbnail') || '',
        tag: searchParams.get('auto') ? 'AUTO' : '',
      });
      Modal.open({
        header: i18n.get('page.room.stateSelectTitle'),
        body: html`
          <nesbox-list
            .data=${reqList
              .map((req) => ({ req, ...getQuery(req.url) }))
              .sort((a, b) => Number(b.time) - Number(a.time))
              .map(({ req, type, ptr, time, thumbnail, tag }) => ({
                img: thumbnail,
                label: time.format(),
                tag,
                onClick: async (evt: PointerEvent) => {
                  const res = await (req === autoCacheReq ? autoCache : cache).match(req);
                  if (!res) return;
                  this.stageRef.element!.loadState({ type, ptr, buffer: await res.arrayBuffer() });
                  Toast.open('success', i18n.get('tip.game.stateLoad', time.format()));
                  evt.target?.dispatchEvent(new CustomEvent('close', { composed: true }));
                },
              }))}
          ></nesbox-list>
        `,
        disableDefaultCancelBtn: true,
        disableDefaultOKBtn: true,
        maskCloseable: true,
      }).catch(() => {
        //
      });
    }
  };

  #uploadScreenshot = async () => {
    if (!this.stageRef.element!.hostRomBuffer) return;
    updateRoomScreenshot({
      id: this.#playing!.id,
      screenshot: await this.stageRef.element!.getThumbnail(),
    });
  };

  #saveScreenshot = async () => {
    if (await this.stageRef.element!.screenshot()) {
      Toast.open('success', i18n.get('tip.game.screenshotSaved'));
    }
  };

  #ramViewer: Window | null;

  #openRamViewer = () => {
    this.#ramViewer = open(
      new URL(routes.ramviewer.pattern, location.origin),
      'viewer',
      'width=480,height=640,top=0,left=0',
    );
  };

  #openComboModal = () => {
    if (!this.#playing) return;
    Modal.open({
      header: i18n.get('settings.combo.title', store.games[this.#playing.gameId]?.name || ''),
      body: html`
        <m-combo-settings .gameId=${this.#playing.gameId}></m-combo-settings>
        <style>
          .footer {
            display: none !important;
          }
        </style>
      `,
      disableDefaultCancelBtn: true,
      disableDefaultOKBtn: true,
      maskCloseable: true,
    }).catch(() => {
      //
    });
  };

  #openCheatModal = () => {
    if (!this.#playing) return;
    Modal.open({
      header: i18n.get('settings.cheat.title', store.games[this.#playing.gameId]?.name || ''),
      body: html`
        <m-cheat-settings .gameId=${this.#playing.gameId}></m-cheat-settings>
        <style>
          .footer {
            display: none !important;
          }
        </style>
      `,
      disableDefaultCancelBtn: true,
      disableDefaultOKBtn: true,
      maskCloseable: true,
    }).catch(() => {
      //
    });
  };

  #onKeyDown = (event: KeyboardEvent) => {
    hotkeys({
      [getShortcut('SCREENSHOT')]: preventDefault(this.#saveScreenshot),
      [getShortcut('SAVE_GAME_STATE')]: preventDefault(this.#save),
      [getShortcut('LOAD_GAME_STATE')]: preventDefault(this.#load),
      [getShortcut('OPEN_RAM_VIEWER')]: preventDefault(this.#openRamViewer),
      [getShortcut('OPEN_CHEAT_SETTINGS')]: preventDefault(this.#openCheatModal),
    })(event);
  };

  #onMessage = ({ data, target }: MessageEvent<BcMsgEvent>) => {
    switch (data.type) {
      case BcMsgType.RAM_REQ: {
        const res: BcMsgEvent = { id: data.id, type: BcMsgType.RAM_RES, data: this.stageRef.element!.getRam() };
        (target as BroadcastChannel).postMessage(res);
        break;
      }
    }
  };

  // each enter room only run once
  #openTours = once(async () => {
    const { openTorus } = await import('src/tours');
    openTorus();
  });

  mounted = () => {
    this.effect(wakeLock, () => []);
    this.effect(
      () => {
        if (configure.user && !this.#playing) {
          this.#autoSave();
          ContextMenu.close();
          const roomFrom = history.getParams().query.get(queryKeys.ROOM_FROM) || '';
          const returnPath = [routes.favorites, routes.rooms, routes.game].some((route) =>
            matchPath(route.pattern, roomFrom),
          );
          history.replace({ path: returnPath ? roomFrom : createPath(routes.games) });
        } else {
          if (!mediaQuery.isPhone) this.#openTours();
          const timer = window.setInterval(this.#uploadScreenshot, 10000);
          return () => {
            clearInterval(timer);
            this.#ramViewer?.close();
          };
        }
      },
      () => [this.#playing],
    );

    const bc = window.BroadcastChannel && new BroadcastChannel('');
    bc?.addEventListener('message', this.#onMessage);

    closeListenerSet.add(this.#autoSave);
    addEventListener('keydown', this.#onKeyDown);
    mountedRoom();
    return () => {
      bc?.close();
      closeListenerSet.delete(this.#autoSave);
      removeEventListener('keydown', this.#onKeyDown);
      unmountedRoom();
    };
  };

  render = () => {
    return html`
      <m-stage
        class="stage"
        ref=${this.stageRef.ref}
        @contextmenu=${this.#onContextMenu}
        .padding=${'1em 0 5em'}
      ></m-stage>
      <dy-space class="info">
        ${this.#isHost ? html`<nesbox-fps></nesbox-fps>` : html`<nesbox-ping></nesbox-ping>`}
        <m-room-recorder class="icon" .getStream=${() => this.stageRef.element!.getStream()}></m-room-recorder>
        <m-room-voice class="icon"></m-room-voice>
      </dy-space>
      <m-ads class="ads" .attrs=${this.#game?.attributes}></m-ads>
      <div class="coach-mark-container">
        <dy-coach-mark index="1"></dy-coach-mark>
      </div>
    `;
  };
}
