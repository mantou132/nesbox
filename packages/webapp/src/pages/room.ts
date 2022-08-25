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
import JSZip from 'jszip';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { waitLoading } from 'duoyun-ui/elements/wait';
import init, { Nes, Button } from '@mantou/nes';
import { ContextMenu } from 'duoyun-ui/elements/menu';
import { Modal } from 'duoyun-ui/elements/modal';
import { DuoyunInputElement } from 'duoyun-ui/elements/input';
import { isNotBoolean } from 'duoyun-ui/lib/types';
import { Toast } from 'duoyun-ui/elements/toast';
import { hash } from 'duoyun-ui/lib/encode';
import { Time } from 'duoyun-ui/lib/time';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';

import { configure, getShortcut } from 'src/configure';
import { routes } from 'src/routes';
import {
  ChannelMessage,
  ChannelMessageType,
  KeyDownMsg,
  KeyUpMsg,
  Role,
  RoleAnswer,
  RoleOffer,
  RTC,
  TextMsg,
} from 'src/rtc';
import { friendStore, store } from 'src/store';
import { i18n } from 'src/i18n';
import type { MRoomChatElement } from 'src/modules/room-chat';
import { getCDNSrc, playHintSound, preventDefault } from 'src/utils';
import { events, queryKeys } from 'src/constants';
import { createInvite, updateRoomScreenshot } from 'src/services/api';
import type { NesboxRenderElement } from 'src/elements/render';
import { closeListenerSet } from 'src/elements/titlebar';

import 'duoyun-ui/elements/space';
import 'src/modules/room-player-list';
import 'src/modules/room-chat';
import 'src/modules/room-voice';
import 'src/modules/nav';
import 'src/elements/fps';
import 'src/elements/ping';
import 'src/elements/render';
import 'src/elements/list';

const style = createCSSSheet(css`
  :host {
    position: absolute;
    inset: 0;
  }
  .canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    box-sizing: border-box;
    padding: 5em;
    object-fit: contain;
    background-color: black;
    pointer-events: none;
  }
  .chat {
    position: absolute;
    inset: auto auto 1rem 1rem;
    width: min(30vw, 20em);
    height: min(40vh, 50em);
  }
  .player-list {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    bottom: 1rem;
    box-sizing: border-box;
    width: min(38em, 100vw);
    padding-inline: 1rem;
  }
  .info {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
  }
  @media ${mediaQuery.PHONE} {
    .info {
      right: 0;
      bottom: 0;
      font-size: 0.15em;
    }
  }
`);

type State = {
  messages: TextMsg[];
  roles: Role[];
};

/**
 * @customElement p-room
 */
@customElement('p-room')
@connectStore(store)
@connectStore(configure)
@adoptedStyle(style)
@connectStore(i18n.store)
export class PRoomElement extends GemElement<State> {
  @refobject canvasRef: RefObject<NesboxRenderElement>;
  @refobject audioRef: RefObject<HTMLAudioElement>;
  @refobject chatRef: RefObject<MRoomChatElement>;

  state: State = {
    messages: [],
    roles: [],
  };

  get #settings() {
    return configure.user?.settings;
  }

  get #playing() {
    return configure.user?.playing;
  }

  get #userId() {
    return configure.user?.id;
  }

  get #isHost() {
    return this.#userId === this.#playing?.host;
  }

  get #rom() {
    return store.games[this.#playing?.gameId || 0]?.rom;
  }

  get #isVisible() {
    return document.visibilityState === 'visible';
  }

  #nes?: Nes;
  #audioContext?: AudioContext;
  #audioStreamDestination?: MediaStreamAudioDestinationNode;
  #gainNode?: GainNode;
  #rtc?: RTC;

  #enableAudio = () => {
    // enable audio state, work on host and client
    this.#nes?.set_sound(true);

    if (this.#isHost) {
      this.#setVolume();
    } else {
      this.audioRef.element!.muted = false;
    }
  };

  #resumeAudio = () => {
    if (this.#nes?.sound()) {
      this.#enableAudio();
    }
  };

  #pauseAudio = () => {
    if (this.#isHost) {
      this.#setVolume(0);
    } else {
      this.audioRef.element!.muted = true;
    }
  };

  #setVolume = (volume = this.#settings?.volume.game || 1) => {
    if (this.#gainNode) {
      this.#gainNode.gain.value = volume;
    }
  };

  #createStream = () => {
    const stream = new MediaStream();

    this.#audioContext = new AudioContext({ sampleRate: this.#sampleRate });
    this.#audioStreamDestination = this.#audioContext.createMediaStreamDestination();
    this.#gainNode = this.#audioContext.createGain();
    this.#gainNode.gain.value = this.#settings?.volume.game || 1;
    this.#gainNode.connect(this.#audioContext.destination);
    stream.addTrack(this.#audioStreamDestination.stream.getAudioTracks()[0]);
    return stream;
  };

  #sampleRate = 44100;
  #bufferSize = this.#sampleRate / 60;
  #nextStartTime = 0;
  #loop = () => {
    if (this.isConnected) requestAnimationFrame(this.#loop);

    if (!this.#nes || !this.#isVisible) return;
    const frameNum = this.#nes.clock_frame();

    const memory = Nes.memory();

    const framePtr = this.#nes.frame(!!this.#rtc?.needSendFrame());
    const frameLen = this.#nes.frame_len();
    this.canvasRef.element!.paint(new Uint8Array(memory.buffer, framePtr, frameLen));

    const qoiFramePtr = this.#nes.qoi_frame();
    const qoiFrameLen = this.#nes.qoi_frame_len();
    this.#rtc?.sendFrame(new Uint8Array(memory.buffer, qoiFramePtr, qoiFrameLen), frameNum);

    if (!this.#nes.sound() || !this.#audioContext || !this.#audioStreamDestination || !this.#gainNode) return;
    const audioBuffer = this.#audioContext.createBuffer(1, this.#bufferSize, this.#sampleRate);
    this.#nes.audio_callback(audioBuffer.getChannelData(0));
    const node = this.#audioContext.createBufferSource();
    node.connect(this.#gainNode);
    node.connect(this.#audioStreamDestination);
    node.buffer = audioBuffer;
    const start = Math.max(this.#nextStartTime, this.#audioContext.currentTime + 0.032);
    node.start(start);
    this.#nextStartTime = start + this.#bufferSize / this.#sampleRate;
  };

  #romBuffer?: ArrayBuffer;
  #initNes = async () => {
    await init();
    this.#nes = Nes.new(this.#sampleRate);
    this.#setVideoFilter();

    if (!this.#isHost) return;

    const zip = await (await fetch(getCDNSrc(this.#rom!))).arrayBuffer();
    const folder = await JSZip.loadAsync(zip);
    this.#romBuffer = await Object.values(folder.files)
      .find((e) => e.name.toLowerCase().endsWith('.nes'))!
      .async('arraybuffer');
    try {
      this.#nes.load_rom(new Uint8Array(this.#romBuffer));
    } catch {
      this.#nes = undefined;
      Toast.open('error', 'ROM 加载错误');
    }
    this.#nextStartTime = 0;
  };

  #onMessage = ({ detail }: CustomEvent<ChannelMessage | ArrayBuffer>) => {
    if (detail instanceof ArrayBuffer) {
      if (this.#nes) {
        const memory = Nes.memory();
        const framePtr = this.#nes.decode_qoi(new Uint8Array(detail));
        const frameLen = this.#nes.decode_qoi_len();
        this.canvasRef.element!.paint(new Uint8Array(memory.buffer, framePtr, frameLen));
      }
      return;
    }
    switch (detail.type) {
      // both
      case ChannelMessageType.CHAT_TEXT:
        if (detail.userId) {
          playHintSound(detail.userId === this.#userId ? 'sended' : 'received');
        }
        this.setState({ messages: [detail as TextMsg, ...this.state.messages] });
        break;
      // both
      case ChannelMessageType.ROLE_ANSWER:
        const roleIds = new Set(this.state.roles.map((role) => role?.userId));
        const newRoles = (detail as RoleAnswer).roles;
        if (newRoles.some((role) => role && !roleIds.has(role.userId) && role.userId !== this.#userId)) {
          playHintSound('joined');
        }
        this.setState({ roles: [...newRoles] });
        break;
      // host
      case ChannelMessageType.KEYDOWN:
        this.#nes?.handle_event((detail as KeyDownMsg).button, true, false);
        break;
      // host
      case ChannelMessageType.KEYUP:
        this.#nes?.handle_event((detail as KeyUpMsg).button, false, false);
        break;
    }
  };

  #initRtc = () => {
    this.#rtc = new RTC();
    this.#rtc.addEventListener('message', this.#onMessage);

    this.#rtc.start({
      host: this.#playing!.host,
      audio: this.audioRef.element!,
      stream: this.#createStream(),
    });
  };

  #getButton = ({ key, metaKey, ctrlKey, shiftKey, altKey }: KeyboardEvent) => {
    const { keybinding } = this.#settings!;
    if (metaKey || ctrlKey || shiftKey || altKey) return;
    const map: Record<string, Button> = {
      [keybinding.Up]: Button.Joypad1Up,
      [keybinding.Left]: Button.Joypad1Left,
      [keybinding.Down]: Button.Joypad1Down,
      [keybinding.Right]: Button.Joypad1Right,
      [keybinding.A]: Button.Joypad1A,
      [keybinding.B]: Button.Joypad1B,
      [keybinding.TurboA]: Button.Joypad1TurboA,
      [keybinding.TurboB]: Button.Joypad1TurboB,
      [keybinding.Select]: Button.Select,
      [keybinding.Start]: Button.Start,
      [keybinding.Reset]: Button.Reset,

      [keybinding.Up_2]: Button.Joypad2Up,
      [keybinding.Left_2]: Button.Joypad2Left,
      [keybinding.Down_2]: Button.Joypad2Down,
      [keybinding.Right_2]: Button.Joypad2Right,
      [keybinding.A_2]: Button.Joypad2A,
      [keybinding.B_2]: Button.Joypad2B,
      [keybinding.TurboA_2]: Button.Joypad2TurboA,
      [keybinding.TurboB_2]: Button.Joypad2TurboB,
    };
    return map[key.toLowerCase()];
  };

  #pressButton = (button: Button) => {
    if (button === Button.Reset) {
      this.#nes?.reset();
    } else {
      this.#enableAudio();
    }
    if (this.#isHost) {
      this.#nes?.handle_event(button, true, false);
    } else {
      this.#rtc?.send(new KeyDownMsg(button));
    }
  };

  #onPressButton = (event: CustomEvent<Button>) => {
    this.#pressButton(event.detail);
  };

  #onKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) return;
    const button = this.#getButton(event);
    if (!button) {
      hotkeys({
        enter: () => this.chatRef.element?.focus(),
        [getShortcut('SAVE_GAME_STATE')]: preventDefault(this.#save),
        [getShortcut('LOAD_GAME_STATE')]: preventDefault(this.#load),
      })(event);
      return;
    }
    this.#pressButton(button);
  };

  #releaseButton = (button: Button) => {
    if (this.#isHost) {
      this.#nes?.handle_event(button, false, false);
    } else {
      this.#rtc?.send(new KeyUpMsg(button));
    }
  };

  #onReleaseButton = (event: CustomEvent<Button>) => {
    this.#releaseButton(event.detail);
  };

  #onKeyUp = (event: KeyboardEvent) => {
    if (event.repeat) return;
    const button = this.#getButton(event);
    if (!button) return;
    this.#releaseButton(button);
  };

  #onContextMenu = (event: MouseEvent) => {
    if (!this.#playing) {
      return event.preventDefault();
    }
    ContextMenu.open(
      [
        !!friendStore.friendIds?.length && {
          text: '邀请好友',
          menu: friendStore.friendIds?.map((id) => ({
            text: friendStore.friends[id]?.user.nickname || '',
            handle: () => createInvite({ roomId: this.#playing!.id, targetId: id }),
          })),
        },
        {
          text: '邀请',
          handle: async () => {
            const input = await Modal.open<DuoyunInputElement>({
              header: '邀请',
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
          text: '分享',
          handle: () => {
            const url = `${location.origin}${createPath(routes.games)}${new QueryString({
              [queryKeys.JOIN_ROOM]: this.#playing!.id,
            })}`;
            navigator.share
              ? navigator
                  .share({
                    url,
                    text: `一起来玩 ${store.games[this.#playing!.gameId]?.name}`,
                  })
                  .catch(() => {
                    //
                  })
              : navigator.clipboard.writeText(url);
          },
        },
      ].filter(isNotBoolean),
      {
        x: event.clientX,
        y: event.clientY,
      },
    );
  };

  #getCachesName = (auto: boolean) => `${auto ? 'auto_' : ''}state_v3`;

  #save = async (auto = false) => {
    if (!this.#romBuffer) return;
    const { buffer } = Nes.memory();
    const thumbnail = this.canvasRef.element!.captureThumbnail();
    const cache = await caches.open(this.#getCachesName(auto));
    const key = await hash(this.#romBuffer);
    await cache.put(
      `/${key}?${new URLSearchParams({ timestamp: Date.now().toString(), thumbnail, auto: auto ? 'auto' : '' })}`,
      new Response(new Blob([buffer])),
    );
    if (auto) return;
    Toast.open('success', i18n.get('tipGameStateSave', new Time().format()));
  };

  #autoSave = () => this.#save(true);

  #uploadScreenshot = () => {
    if (!this.#romBuffer || !this.#isVisible) return;
    updateRoomScreenshot({
      id: this.#playing!.id,
      screenshot: this.canvasRef.element!.captureThumbnail(),
    });
  };

  #load = async () => {
    if (!this.#isHost || !this.#romBuffer) return;
    const { buffer } = Nes.memory();
    const key = await hash(this.#romBuffer);
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
                  new Uint8Array(buffer).set(new Uint8Array(await res.arrayBuffer()));
                  Toast.open('success', i18n.get('tipGameStateLoad', time.format()));
                  evt.target?.dispatchEvent(new CustomEvent('close', { composed: true }));
                },
              }))}
          ></nesbox-list>
        `,
        disableDefualtCancelBtn: true,
        disableDefualtOKBtn: true,
        maskCloseable: true,
      });
    }
  };

  #setVideoFilter = () => {
    this.#settings && this.#nes?.set_filter(this.#settings.video.filter);
  };

  mounted = () => {
    if (this.#isHost) requestAnimationFrame(this.#loop);

    this.effect(
      () => this.#setVolume,
      () => [this.#settings?.volume.game],
    );

    this.effect(
      () => {
        if (!this.#playing) {
          this.#autoSave();
          history.replace({
            path: createPath(routes.games),
          });
          ContextMenu.close();
        } else {
          const timer = window.setInterval(this.#uploadScreenshot, 10000);
          return () => clearInterval(timer);
        }
      },
      () => [this.#playing],
    );

    this.effect(
      () => {
        if (this.#playing) {
          this.#rtc?.destroy();
          this.#audioContext?.close();
          this.#initRtc();
        }

        if (this.#rom) {
          waitLoading(this.#initNes());
        }
      },
      () => [this.#playing?.id, this.#rom],
    );

    this.effect(this.#setVideoFilter, () => [this.#nes, this.#settings?.video]);

    this.addEventListener('contextmenu', this.#onContextMenu);

    closeListenerSet.add(this.#autoSave);
    addEventListener('keydown', this.#onKeyDown);
    addEventListener('keyup', this.#onKeyUp);
    addEventListener(events.PRESS_BUTTON, this.#onPressButton);
    addEventListener(events.RELEASE_BUTTON, this.#onReleaseButton);
    addEventListener('focus', this.#resumeAudio);
    addEventListener('blur', this.#pauseAudio);
    return () => {
      this.#audioContext?.close();
      this.#rtc?.destroy();
      closeListenerSet.delete(this.#autoSave);
      removeEventListener('keydown', this.#onKeyDown);
      removeEventListener('keyup', this.#onKeyUp);
      removeEventListener(events.PRESS_BUTTON, this.#onPressButton);
      removeEventListener(events.RELEASE_BUTTON, this.#onReleaseButton);
      removeEventListener('focus', this.#resumeAudio);
      removeEventListener('blur', this.#pauseAudio);
    };
  };

  render = () => {
    const { messages, roles } = this.state;

    return html`
      <nesbox-render class="canvas" ref=${this.canvasRef.ref}></nesbox-render>
      <audio ref=${this.audioRef.ref} hidden></audio>
      <m-room-chat
        class="chat"
        ref=${this.chatRef.ref}
        .messages=${messages}
        @submit=${({ detail }: CustomEvent<TextMsg>) => this.#rtc?.send(detail)}
      ></m-room-chat>
      <m-room-player-list
        class="player-list"
        .isHost=${this.#isHost}
        .roles=${roles}
        @rolechange=${({ detail }: CustomEvent<RoleOffer>) => this.#rtc?.send(detail)}
        @kickout=${({ detail }: CustomEvent<number>) => this.#rtc?.kickoutRole(detail)}
      ></m-room-player-list>
      <dy-space class="info">
        ${this.#isHost ? html`<nesbox-fps></nesbox-fps>` : html`<nesbox-ping></nesbox-ping>`}
        <m-room-voice></m-room-voice>
      </dy-space>
    `;
  };
}
