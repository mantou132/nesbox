import {
  GemElement,
  html,
  adoptedStyle,
  customElement,
  createCSSSheet,
  css,
  connectStore,
  refobject,
  RefObject,
  styleMap,
} from '@mantou/gem';
import JSZip from 'jszip';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { waitLoading } from 'duoyun-ui/elements/wait';
import { default as initNes, Nes, Button, Player } from '@mantou/nes';
import { Toast } from 'duoyun-ui/elements/toast';
import { isNotNullish } from 'duoyun-ui/lib/types';
import { clamp } from 'duoyun-ui/lib/number';
import { isMtApp } from 'mt-app';
import { getCDNSrc, isValidGameFile, playHintSound, positionMapping, requestFrame } from 'src/utils';

import { events, gameStateType, RTCTransportType } from 'src/constants';
import { logger } from 'src/logger';
import { Cheat, configure } from 'src/configure';
import {
  ChannelMessage,
  ChannelMessageType,
  KeyDownMsg,
  KeyUpMsg,
  PointerMoveMsg,
  Role,
  RoleAnswer,
  RoleOffer,
  RTC,
  TextMsg,
} from 'src/rtc';
import { store } from 'src/store';
import { i18n } from 'src/i18n';

import type { MRoomChatElement } from 'src/modules/room-chat';
import type { NesboxCanvasElement } from 'src/elements/canvas';

import 'src/modules/room-player-list';
import 'src/modules/room-chat';
import 'src/modules/room-voice';
import 'src/elements/canvas';

const style = createCSSSheet(css`
  :host {
    position: relative;
    display: block;
    background: black;
  }
  .canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
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
`);

type State = {
  messages: TextMsg[];
  roles: Partial<Record<Player, Role>>;
  cheats: Exclude<ReturnType<typeof MStageElement.parseCheatCode>, undefined>[];
  cheatKeyHandles: Record<string, (evt: KeyboardEvent) => void>;
  canvasWidth: number;
  canvasHeight: number;
};

/**
 * @customElement m-stage
 */
@customElement('m-stage')
@connectStore(store)
@connectStore(configure)
@adoptedStyle(style)
@connectStore(i18n.store)
export class MStageElement extends GemElement<State> {
  @refobject canvasRef: RefObject<NesboxCanvasElement>;
  @refobject audioRef: RefObject<HTMLAudioElement>;
  @refobject chatRef: RefObject<MRoomChatElement>;

  state: State = {
    messages: [],
    roles: {},
    cheats: [],
    cheatKeyHandles: {},
    canvasWidth: 0,
    canvasHeight: 0,
  };

  static mapPointerButton(event: PointerEvent) {
    switch (event.button) {
      case 0:
        return Button.Pointer1Left;
      case 2:
        return Button.Pointer1Right;
      default:
        return;
    }
  }

  static parseCheatCode = (cheat: Cheat) => {
    const result = cheat.code.match(/^(?<addr>[0-9A-F]{4})-(?<type>[0-3])(?<len>[1-4])-(?<val>([0-9A-F]{2})+)$/);
    if (!result) return;
    const { addr, type, len, val } = result.groups!;
    if (val.length !== 2 * Number(len)) return;
    return {
      cheat,
      enabled: cheat.enabled,
      addr: parseInt(addr, 16),
      type: Number(type) as 0 | 1 | 2 | 3,
      len: Number(len),
      val: val
        .split(/(\w{2}\b)/)
        .filter((e) => !!e)
        .map((e) => parseInt(e, 16)),
    };
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

  #game?: Nes;
  #audioContext?: AudioContext;
  #audioStreamDestination?: MediaStreamAudioDestinationNode;
  #gainNode?: GainNode;
  #rtc?: RTC;

  #enableAudio = () => {
    // enable audio state, work on host and client
    this.#game?.set_sound(true);

    if (this.#isHost) {
      this.#setVolume();
    } else {
      this.audioRef.element!.muted = false;
    }
  };

  #resumeAudio = () => {
    if (this.#game?.sound()) {
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

  #execCheat = () => {
    if (!this.#game) return;
    this.state.cheats.forEach((cheat) => {
      const { enabled, addr, type, val } = cheat;
      if (!enabled) return;
      switch (type) {
        case 0:
          val.forEach((v, i) => this.#game!.write_ram(addr + i, v));
          break;
        case 1:
          val.forEach((v, i) => this.#game!.write_ram(addr + i, v));
          cheat.enabled = false;
          break;
        case 2:
          if (this.#game!.read_ram(addr) > val[0]) {
            this.#game!.write_ram(addr, val[0]);
          }
          break;
        case 3:
          if (this.#game!.read_ram(addr) < val[0]) {
            this.#game!.write_ram(addr, val[0]);
          }
          break;
      }
    });
  };

  #sampleRate = 44100;
  #bufferSize = this.#sampleRate / 60;
  #nextStartTime = 0;
  #loop = () => {
    if (!this.#game || !this.#isVisible) return;
    this.#execCheat();
    const frameNum = this.#game.clock_frame();

    const memory = this.#game.mem();

    const framePtr = this.#game.frame(
      !!this.#rtc?.needSendFrame(),
      this.#settings?.video.rtcImprove !== RTCTransportType.CLIP || frameNum % 180 === 0,
    );
    const frameLen = this.#game.frame_len();
    this.canvasRef.element!.paint(new Uint8Array(memory.buffer, framePtr, frameLen));

    const qoiFramePtr = this.#game.qoi_frame();
    const qoiFrameLen = this.#game.qoi_frame_len();
    this.#rtc?.sendFrame(new Uint8Array(memory.buffer, qoiFramePtr, qoiFrameLen), frameNum);

    if (!this.#game.sound() || !this.#audioContext || !this.#audioStreamDestination || !this.#gainNode) return;
    const audioBuffer = this.#audioContext.createBuffer(1, this.#bufferSize, this.#sampleRate);
    this.#game.audio_callback(audioBuffer.getChannelData(0));
    const node = this.#audioContext.createBufferSource();
    node.connect(this.#gainNode);
    node.connect(this.#audioStreamDestination);
    node.buffer = audioBuffer;
    const start = clamp(this.#audioContext.currentTime, this.#nextStartTime, this.#audioContext.currentTime + 4 / 60);
    node.start(start);
    this.#nextStartTime = start + 1 / 60;
  };

  hostRomBuffer?: ArrayBuffer;
  #loadRom = async () => {
    // 在这里 free 的原因是卸载时需要自动保存状态，可能会读取 wasm 内存
    this.#game?.free();
    this.#game = undefined;
    this.hostRomBuffer = undefined;

    try {
      const zip = await (await fetch(getCDNSrc(this.#rom!))).arrayBuffer();
      const folder = await JSZip.loadAsync(zip);
      const file = Object.values(folder.files).find((e) => isValidGameFile(e.name))!;
      const romBuffer = await file.async('arraybuffer');

      let game: Nes;

      switch (file.name.toLowerCase().split('.').pop()) {
        case 'wasm': {
          await initNes(new Response(romBuffer, { headers: { 'content-type': 'application/wasm' } }));
          game = Nes.new(this.#sampleRate);
          break;
        }
        case 'js': {
          const { default: initNes, Nes } = await import('@mantou/nes-sandbox');
          await initNes();
          const jsGame = Nes.new(this.#sampleRate);
          await jsGame.load_rom(new Uint8Array(romBuffer));
          game = jsGame;
          break;
        }
        default: {
          await initNes();
          game = Nes.new(this.#sampleRate);
          game.load_rom(new Uint8Array(romBuffer));
        }
      }

      this.#setVideoFilter();
      this.setState({ canvasWidth: game.width(), canvasHeight: game.height() });
      this.#game = game;
      if (this.#isHost) {
        this.hostRomBuffer = romBuffer;
      }
    } catch (err) {
      logger.error(err);
      Toast.open('error', 'ROM 加载错误');
    }
    this.#nextStartTime = 0;
  };

  #onMessage = ({ detail }: CustomEvent<ChannelMessage | ArrayBuffer>) => {
    if (detail instanceof ArrayBuffer) {
      if (this.#game) {
        const memory = this.#game.mem();
        const qoiBuffer = new Uint8Array(detail);
        if (qoiBuffer.length <= 4) return;
        const part = new Uint8Array(detail, qoiBuffer.length - 4, 4);
        const framePtr = this.#game.decode_qoi(qoiBuffer);
        const frameLen = this.#game.decode_qoi_len();
        const frame = new Uint8Array(memory.buffer, framePtr, frameLen);
        this.canvasRef.element!.paint(frame, [...part]);
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
        const roleIds = new Set(Object.values(this.state.roles).map((role) => role?.userId));
        const newRoles = (detail as RoleAnswer).roles;
        if (Object.values(newRoles).some((role) => role && !roleIds.has(role.userId) && role.userId !== this.#userId)) {
          playHintSound('joined');
        }
        this.setState({ roles: { ...newRoles } });
        break;
      // host
      case ChannelMessageType.KEYDOWN:
        this.#game?.handle_button_event((detail as KeyDownMsg).button, true, false);
        break;
      // host
      case ChannelMessageType.KEYUP:
        this.#game?.handle_button_event((detail as KeyUpMsg).button, false, false);
        break;
      // host
      case ChannelMessageType.POINTER_MOVE:
        const { player, x, y, dx, dy } = detail as PointerMoveMsg;
        this.#game?.handle_motion_event(player, x, y, dx, dy);
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

  #getButton = (event: KeyboardEvent | PointerEvent) => {
    const { keybinding } = this.#settings!;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const map: Record<string, Button> = {
      [keybinding.Up_2]: Button.Joypad2Up,
      [keybinding.Left_2]: Button.Joypad2Left,
      [keybinding.Down_2]: Button.Joypad2Down,
      [keybinding.Right_2]: Button.Joypad2Right,
      [keybinding.A_2]: Button.Joypad2A,
      [keybinding.B_2]: Button.Joypad2B,
      [keybinding.TurboA_2]: Button.Joypad2TurboA,
      [keybinding.TurboB_2]: Button.Joypad2TurboB,

      // 重复时覆盖 joypad1
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
    };

    if (event instanceof PointerEvent) {
      return MStageElement.mapPointerButton(event);
    }
    return map[event.key.toLowerCase()];
  };

  #onPointerMove = (event: PointerEvent) => {
    if (!this.#game) return;
    const [x, y, dx, dy] = positionMapping(event, this.canvasRef.element!);
    if (this.#isHost) {
      this.#game.handle_motion_event(Player.One, x, y, dx, dy);
    } else {
      this.#rtc?.send(new PointerMoveMsg(x, y, dx, dy));
    }
  };

  #pressButton = (button: Button) => {
    if (button === Button.Reset) {
      this.#game?.reset();
    } else {
      this.#enableAudio();
    }
    if (this.#isHost) {
      this.#game?.handle_button_event(button, true, false);
    } else {
      this.#rtc?.send(new KeyDownMsg(button));
    }
  };

  #onPressButton = (event: CustomEvent<Button>) => {
    this.#pressButton(event.detail);
  };

  #onKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) return;
    if (event.isComposing) return;
    const button = this.#getButton(event);
    if (button) {
      this.#pressButton(button);
      event.stopPropagation();
    } else {
      hotkeys({
        enter: (event: KeyboardEvent) => {
          this.chatRef.element?.focus();
          event.stopPropagation();
        },
        ...this.state.cheatKeyHandles,
      })(event);
    }
  };

  #onPointerDown = (event: PointerEvent) => {
    const button = this.#getButton(event);
    if (!button) return;
    this.#pressButton(button);
  };

  #releaseButton = (button: Button) => {
    if (this.#isHost) {
      this.#game?.handle_button_event(button, false, false);
    } else {
      this.#rtc?.send(new KeyUpMsg(button));
    }
  };

  #onReleaseButton = (event: CustomEvent<Button>) => {
    this.#releaseButton(event.detail);
  };

  #onKeyUp = (event: KeyboardEvent) => {
    if (event.repeat) return;
    if (event.isComposing) return;
    const button = this.#getButton(event);
    if (!button) return;
    this.#releaseButton(button);
  };

  #onPointerUp = (event: PointerEvent) => {
    const button = this.#getButton(event);
    if (!button) return;
    this.#releaseButton(button);
  };

  #setVideoFilter = () => {
    this.#settings && this.#game?.set_filter(this.#settings.video.filter);
  };

  mounted = () => {
    this.effect(
      () => {
        if (this.#isHost) {
          return requestFrame(this.#loop, this.#settings?.video.refreshRate);
        }
      },
      () => [this.#settings?.video.refreshRate],
    );

    this.effect(
      () => {
        if (this.#playing) {
          this.#rtc?.destroy();
          this.#audioContext?.close();
          this.#initRtc();
        }
      },
      () => [this.#playing?.id],
    );

    this.memo(
      () => {
        const gameId = this.#playing?.gameId;
        const cheatSettings = this.#settings?.cheat;
        if (gameId && cheatSettings) {
          const cheats = (cheatSettings[gameId] || [])
            .map((cheat) => MStageElement.parseCheatCode(cheat))
            .filter(isNotNullish);

          this.setState({
            cheats,
            cheatKeyHandles: Object.fromEntries(
              cheats
                .filter((cheat) => cheat.cheat.toggleKey)
                .map((cheat) => [
                  cheat.cheat.toggleKey,
                  (evt: KeyboardEvent) => {
                    cheat.enabled = !cheat.enabled;
                    evt.stopPropagation();
                  },
                ]),
            ),
          });
        }
      },
      () => [this.#playing?.gameId, this.#settings?.cheat],
    );

    this.effect(
      () => this.#rom && waitLoading(this.#loadRom()),
      () => [this.#rom],
    );

    this.effect(this.#setVideoFilter, () => [this.#game, this.#settings?.video]);

    this.effect(
      (muteArgs) => (muteArgs!.every((e) => !e) ? this.#resumeAudio() : this.#pauseAudio()),
      () => [!configure.windowHasFocus, configure.searchState, configure.settingsState, configure.friendListState],
    );

    addEventListener('pointermove', this.#onPointerMove);
    addEventListener('keydown', this.#onKeyDown);
    this.addEventListener('pointerdown', this.#onPointerDown);
    addEventListener('keyup', this.#onKeyUp);
    this.addEventListener('pointerup', this.#onPointerUp);
    addEventListener(events.PRESS_BUTTON, this.#onPressButton);
    addEventListener(events.RELEASE_BUTTON, this.#onReleaseButton);
    return () => {
      this.#audioContext?.close();
      this.#rtc?.destroy();
      removeEventListener('pointermove', this.#onPointerMove);
      removeEventListener('keydown', this.#onKeyDown);
      this.removeEventListener('pointerdown', this.#onPointerDown);
      removeEventListener('keyup', this.#onKeyUp);
      this.removeEventListener('pointerup', this.#onPointerUp);
      removeEventListener(events.PRESS_BUTTON, this.#onPressButton);
      removeEventListener(events.RELEASE_BUTTON, this.#onReleaseButton);
    };
  };

  render = () => {
    const { messages, roles, canvasWidth, canvasHeight } = this.state;

    return html`
      <nesbox-canvas
        class="canvas"
        ref=${this.canvasRef.ref}
        .width=${canvasWidth}
        .height=${canvasHeight}
        style=${styleMap({
          padding: isMtApp ? '2em 5em 5em' : '5em',
          imageRendering: configure.user ? configure.user.settings.video.render : 'pixelated',
        })}
      ></nesbox-canvas>
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
        @kickout=${({ detail }: CustomEvent<number>) => this.#rtc?.kickOutRole(detail)}
      ></m-room-player-list>
    `;
  };

  getThumbnail = () => {
    return this.canvasRef.element!.captureThumbnail();
  };

  screenshot = () => {
    return this.canvasRef.element!.screenshot();
  };

  getState = (): GameState | undefined => {
    if (!this.#game) return;
    const state = this.#game.state();
    if (state.length === 0) {
      const buffer = this.#game.mem().buffer;
      logger.warn(`Saved wasm memory: ${(buffer.byteLength / 1024).toFixed(0)}KB`);
      return {
        type: gameStateType.WASM,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ptr: String(this.#game.ptr),
        buffer,
      };
    } else {
      return {
        type: gameStateType.NORMAL,
        buffer: state.buffer,
      };
    }
  };

  loadState = ({ buffer, type, ptr }: GameState) => {
    if (!this.#game) return;
    const stateArray = new Uint8Array(buffer);
    if (type === gameStateType.WASM) {
      const mem: WebAssembly.Memory = this.#game.mem();
      if (stateArray.length > mem.buffer.byteLength) {
        mem.grow((stateArray.length - mem.buffer.byteLength) / (64 * 1024));
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.#game.ptr = Number(ptr);
      new Uint8Array(mem.buffer).set(stateArray);
    } else {
      this.#game.load_state(stateArray);
    }
    this.#setVideoFilter();
  };

  getRam = () => {
    return this.#game?.ram();
  };
}

export type GameState = {
  type: string;
  buffer: ArrayBuffer;
  ptr?: string;
};