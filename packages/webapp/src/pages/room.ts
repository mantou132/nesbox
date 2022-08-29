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
import { createPath } from 'duoyun-ui/elements/route';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { ContextMenu } from 'duoyun-ui/elements/menu';
import { Modal } from 'duoyun-ui/elements/modal';
import { DuoyunInputElement } from 'duoyun-ui/elements/input';
import { isNotBoolean } from 'duoyun-ui/lib/types';
import { Toast } from 'duoyun-ui/elements/toast';
import { hash } from 'duoyun-ui/lib/encode';
import { Time } from 'duoyun-ui/lib/time';
import { getStringFromTemplate } from 'duoyun-ui/lib/utils';

import { configure, getShortcut } from 'src/configure';
import { routes } from 'src/routes';
import { friendStore, store } from 'src/store';
import { i18n } from 'src/i18n';
import { preventDefault } from 'src/utils';
import { BcMsgEvent, BcMsgType, queryKeys } from 'src/constants';
import { createInvite, updateRoomScreenshot } from 'src/services/api';
import { closeListenerSet } from 'src/elements/titlebar';
import type { MNesElement } from 'src/modules/nes';

import 'src/modules/nes';
import 'src/modules/cheat-settings';
import 'src/elements/list';

const style = createCSSSheet(css`
  .nes {
    position: absolute;
    inset: 0;
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
  @refobject nesbox: RefObject<MNesElement>;

  get #playing() {
    return configure.user?.playing;
  }

  #onContextMenu = (event: MouseEvent) => {
    if (!this.#playing) {
      return event.preventDefault();
    }
    ContextMenu.open(
      [
        !!friendStore.friendIds?.length && {
          text: i18n.get('inviteValidFriend'),
          menu: friendStore.friendIds?.map((id) => ({
            text: friendStore.friends[id]?.user.nickname || '',
            handle: () => createInvite({ roomId: this.#playing!.id, targetId: id }),
          })),
        },
        {
          text: i18n.get('inviteFriend'),
          handle: async () => {
            const input = await Modal.open<DuoyunInputElement>({
              header: i18n.get('inviteFriend'),
              body: html`
                <dy-input
                  autofocus
                  style="width: 100%"
                  placeholder=${i18n.get('placeholderUsername')}
                  @change=${(e: any) => (e.target.value = e.detail)}
                ></dy-input>
              `,
            });
            createInvite({ roomId: this.#playing!.id, targetId: 0, tryUsername: input.value });
          },
        },
        {
          text: i18n.get('share'),
          handle: () => {
            const url = `${location.origin}${createPath(routes.games)}${new QueryString({
              [queryKeys.JOIN_ROOM]: this.#playing!.id,
            })}`;
            navigator.share
              ? navigator
                  .share({
                    url,
                    text: getStringFromTemplate(i18n.get('shareDesc', store.games[this.#playing!.gameId]?.name || '')),
                  })
                  .catch(() => {
                    //
                  })
              : navigator.clipboard.writeText(url);
          },
        },
        {
          text: '---',
        },
        {
          text: i18n.get('shortcutScreenshot'),
          handle: this.#saveScreenshot,
          tag: getShortcut('SCREENSHOT', true),
        },
        {
          text: i18n.get('shortcutSave'),
          handle: this.#save,
          tag: getShortcut('SAVE_GAME_STATE', true),
        },
        {
          text: i18n.get('shortcutLoad'),
          handle: this.#load,
          tag: getShortcut('LOAD_GAME_STATE', true),
        },
        {
          text: i18n.get('shortcutOpenRam'),
          handle: this.#openRamViewer,
          tag: getShortcut('OPEN_RAM_VIEWER', true),
        },
        {
          text: i18n.get('shortcutOpenCheat'),
          handle: this.#openCheatModal,
          tag: getShortcut('OPEN_CHEAT_SETTINGS', true),
        },
      ].filter(isNotBoolean),
      {
        x: event.clientX,
        y: event.clientY,
      },
    );
  };

  #getCachesName = (auto: boolean) => `${auto ? 'auto_' : ''}state_v5`;

  #save = async (auto = false) => {
    if (!this.nesbox.element!.romBuffer) return;
    const buffer = this.nesbox.element!.getState();
    if (!buffer) return;
    const thumbnail = this.nesbox.element!.getThumbnail();
    const cache = await caches.open(this.#getCachesName(auto));
    const key = await hash(this.nesbox.element!.romBuffer!);
    await cache.put(
      `/${key}?${new URLSearchParams({ timestamp: Date.now().toString(), thumbnail, auto: auto ? 'auto' : '' })}`,
      new Response(new Blob([buffer]), {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': buffer.length.toString(),
        },
      }),
    );
    if (auto) return;
    Toast.open('success', i18n.get('tipGameStateSave', new Time().format()));
  };

  #autoSave = () => this.#save(true);

  #load = async () => {
    if (!this.nesbox.element!.romBuffer) return;
    const key = await hash(this.nesbox.element!.romBuffer);
    const cache = await caches.open(this.#getCachesName(false));
    const reqs = [...(await cache.keys(`/${key}`, { ignoreSearch: true }))].splice(0, 10);
    const autoCache = await caches.open(this.#getCachesName(true));
    const autoCacheReqs = await autoCache.keys(`/${key}`, { ignoreSearch: true });
    const autoCacheReq = autoCacheReqs[autoCacheReqs.length - 1];
    if (autoCacheReq) {
      reqs.unshift(autoCacheReq);
    }
    if (reqs.length === 0) {
      Toast.open('default', i18n.get('tipGameStateMissing'));
    } else {
      const getQuery = (url: string, { searchParams } = new URL(url)) => ({
        time: new Time(Number(searchParams.get('timestamp'))),
        thumbnail: searchParams.get('thumbnail') || '',
        tag: searchParams.get('auto') ? 'AUTO' : '',
      });
      Modal.open({
        header: i18n.get('tipGameStateTitle'),
        body: html`
          <nesbox-list
            .data=${reqs
              .map((req) => ({ req, ...getQuery(req.url) }))
              .sort((a, b) => Number(b.time) - Number(a.time))
              .map(({ req, time, thumbnail, tag }) => ({
                img: thumbnail,
                label: time.format(),
                tag,
                onClick: async (evt: PointerEvent) => {
                  const res = await (req === autoCacheReq ? autoCache : cache).match(req);
                  if (!res) return;
                  this.nesbox.element!.loadState(new Uint8Array(await res.arrayBuffer()));
                  Toast.open('success', i18n.get('tipGameStateLoad', time.format()));
                  evt.target?.dispatchEvent(new CustomEvent('close', { composed: true }));
                },
              }))}
          ></nesbox-list>
        `,
        disableDefualtCancelBtn: true,
        disableDefualtOKBtn: true,
        maskCloseable: true,
      }).catch(() => {
        //
      });
    }
  };

  #uploadScreenshot = () => {
    if (!this.nesbox.element!.romBuffer) return;
    updateRoomScreenshot({
      id: this.#playing!.id,
      screenshot: this.nesbox.element!.getThumbnail(),
    });
  };

  #saveScreenshot = async () => {
    if (!this.nesbox.element!.romBuffer) return;
    if (await this.nesbox.element!.screenshot()) {
      Toast.open('success', i18n.get('tipScreenshotSaved'));
    }
  };

  #ramviewer: Window | null;

  #openRamViewer = () => {
    this.#ramviewer = open(
      new URL(routes.ramviewer.pattern, location.origin),
      'viewer',
      'width=480,height=640,top=0,left=0',
    );
  };

  #openCheatModal = () => {
    if (!this.#playing) return;
    Modal.open({
      header: i18n.get('cheatSettingsTitle', store.games[this.#playing.gameId]?.name || ''),
      body: html`<m-cheat-settings .gameId=${this.#playing.gameId}></m-cheat-settings>`,
      disableDefualtCancelBtn: true,
      disableDefualtOKBtn: true,
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
        const res: BcMsgEvent = { id: data.id, type: BcMsgType.RAM_RES, data: this.nesbox.element!.getRam() };
        (target as BroadcastChannel).postMessage(res);
        break;
      }
    }
  };

  mounted = () => {
    this.effect(
      () => {
        if (!this.#playing) {
          this.#autoSave();
          ContextMenu.close();
          history.replace({ path: createPath(routes.games) });
        } else {
          const timer = window.setInterval(this.#uploadScreenshot, 10000);
          return () => {
            clearInterval(timer);
            this.#ramviewer?.close();
          };
        }
      },
      () => [this.#playing],
    );

    const bc = window.BroadcastChannel && new BroadcastChannel('');
    bc?.addEventListener('message', this.#onMessage);

    closeListenerSet.add(this.#autoSave);
    addEventListener('keydown', this.#onKeyDown);
    return () => {
      bc?.close();
      closeListenerSet.delete(this.#autoSave);
      removeEventListener('keydown', this.#onKeyDown);
    };
  };

  render = () => {
    return html`<m-nes class="nes" ref=${this.nesbox.ref} @contextmenu=${this.#onContextMenu}></m-nes>`;
  };
}
