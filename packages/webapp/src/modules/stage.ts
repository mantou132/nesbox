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
  attribute,
  state,
} from '@mantou/gem';
import JSZip from 'jszip';
import { hotkeys } from 'duoyun-ui/lib/hotkeys';
import { changeLoading, waitLoading } from 'duoyun-ui/elements/wait';
import { Nes, Button, Player } from '@mantou/nes';
import { isNotNullish } from 'duoyun-ui/lib/types';
import { clamp } from 'duoyun-ui/lib/number';

import {
  ChannelMessage,
  ChannelMessageType,
  KeyDownMsg,
  KeyUpMsg,
  PointerMoveMsg,
  Role,
  RoleAnswer,
  RoleOffer,
  TextMsg,
} from 'src/netplay/common';
import { RTCHost } from 'src/netplay/host';
import { RTCClient } from 'src/netplay/client';
import { getCDNSrc, isValidGameFile, playHintSound, progressFetch } from 'src/utils/common';
import {
  CustomGamepadButton,
  globalEvents,
  gameStateType,
  RTCTransportType,
  VideoFilter,
  VideoRenderMethod,
} from 'src/constants';
import { logger } from 'src/logger';
import { configure } from 'src/configure';
import { store } from 'src/store';
import {
  createGame,
  mapPointerButton,
  parseCheatCode,
  parseComboCode,
  positionMapping,
  requestFrame,
  watchDevRom,
} from 'src/utils/game';
import { ScGamePlatform } from 'src/generated/graphql';

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
  :host(:where(:--playing, :state(playing))) {
    cursor: none;
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
  cheats: Exclude<ReturnType<typeof parseCheatCode>, undefined>[];
  cheatKeyHandles: Record<string, (evt: KeyboardEvent) => void>;
  combos: ReturnType<typeof parseComboCode>[];
  comboKeyHandles: Record<string, (evt: KeyboardEvent) => void>;
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
export class MStageElement extends GemElement<State> {
  @refobject canvasRef: RefObject<NesboxCanvasElement>;
  @refobject audioRef: RefObject<HTMLAudioElement>;
  @refobject chatRef: RefObject<MRoomChatElement>;
  @attribute padding: string;
  @state playing: boolean;

  state: State = {
    messages: [],
    roles: {},
    cheats: [],
    cheatKeyHandles: {},
    combos: [],
    comboKeyHandles: {},
    canvasWidth: 0,
    canvasHeight: 0,
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

  get #game() {
    return store.games[this.#playing?.gameId || 0];
  }

  get #rom() {
    return this.#game?.rom;
  }

  get #isVisible() {
    return document.visibilityState === 'visible';
  }

  #abortController?: AbortController;
  #gameInstance?: Nes;
  #audioContext?: AudioContext;
  #audioStreamDestination?: MediaStreamAudioDestinationNode;
  #gainNode?: GainNode;
  #rtc?: RTCHost | RTCClient;

  #enableAudio = () => {
    // 在主机和客户机中都作为一个“允许播放”的状态开关
    // 用在重新聚焦后作为判断依据
    this.#gameInstance?.set_sound(true);

    if (this.#isHost) {
      this.#setVolume();
    } else {
      this.audioRef.element!.muted = false;
    }
  };

  #resumeAudio = () => {
    if (this.#gameInstance?.sound()) {
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

  #createAudioStream = () => {
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
    if (!this.#gameInstance) return;
    const readVal = (addr: number, len: number) => {
      return new Uint32Array(
        new Uint8Array(
          Array.from({ length: len === 3 ? 4 : len }, (v, i) => {
            return this.#gameInstance!.read_ram(addr + i);
          }),
        ).buffer,
      )[0];
    };
    this.state.cheats.forEach((cheat) => {
      const { enabled, addr, type, bytes, val, len } = cheat;
      if (!enabled) return;
      const write = () => bytes.forEach((byte, i) => this.#gameInstance!.write_ram(addr + i, byte));
      switch (type) {
        case 0:
          write();
          break;
        case 1:
          write();
          cheat.enabled = false;
          break;
        case 2:
          if (readVal(addr, len) > val) write();
          break;
        case 3:
          if (readVal(addr, len) < val) write();
          break;
      }
    });
  };

  #currentComboMap = new Map<ReturnType<typeof parseComboCode>, number>();
  #stepCombo = () => {
    this.#currentComboMap.forEach((index, combo) => {
      const prevFrame = combo.frames[index - 1];
      const frame = combo.frames[index];
      if (frame === prevFrame) {
        this.#currentComboMap.set(combo, index + 1);
        return;
      }
      prevFrame?.forEach((key) => {
        this.#onKeyUp(new KeyboardEvent('keyup', { key }));
      });
      if (frame) {
        frame.forEach((key) => {
          this.#onKeyDown(new KeyboardEvent('keydown', { key }));
        });
        this.#currentComboMap.set(combo, index + 1);
      } else {
        this.#currentComboMap.delete(combo);
      }
    });
  };

  #sampleRate = 44100;
  #bufferSize = this.#sampleRate / 60;
  #nextStartTime = 0;
  #loop = () => {
    if (!this.#gameInstance || !this.#isVisible) return;
    this.#execCheat();
    this.#stepCombo();
    const frameNum = this.#gameInstance.clock_frame();

    const memory = this.#gameInstance.mem();

    const framePtr = this.#gameInstance.frame(
      !!this.#rtc?.needSendFrame(),
      this.#settings?.video.rtcImprove !== RTCTransportType.CLIP || frameNum % 180 === 0,
    );
    const frameLen = this.#gameInstance.frame_len();
    this.canvasRef.element!.paint(new Uint8Array(memory.buffer, framePtr, frameLen));

    const qoiFramePtr = this.#gameInstance.qoi_frame();
    const qoiFrameLen = this.#gameInstance.qoi_frame_len();
    this.#rtc?.sendFrame(new Uint8Array(memory.buffer, qoiFramePtr, qoiFrameLen), frameNum);

    if (!this.#gameInstance.sound() || !this.#audioContext || !this.#audioStreamDestination || !this.#gainNode) return;
    const audioBuffer = this.#audioContext.createBuffer(1, this.#bufferSize, this.#sampleRate);
    this.#gameInstance.audio_callback(audioBuffer.getChannelData(0));
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
    this.#gameInstance = undefined;
    this.hostRomBuffer = undefined;
    this.#abortController = new AbortController();

    try {
      const url = new URL(this.#rom!);
      let romBuffer = (await progressFetch(getCDNSrc(this.#rom!), { signal: this.#abortController.signal })).buffer;
      let filename = url.pathname.split('/').pop()!;

      // 街机模拟器依赖 zip 档文件名，所以不能修改文件名
      // 不是街机需要解压 zip 档
      if (!url.searchParams.has('arcade') && this.#game!.platform !== ScGamePlatform.Arcade) {
        const folder = await JSZip.loadAsync(romBuffer);
        const file = Object.values(folder.files).find((e) => isValidGameFile(e.name))!;
        romBuffer = await file.async('arraybuffer');
        filename = file.name;
      }

      // 区分通用 wasm 游戏
      if (this.#game!.platform === ScGamePlatform.Wasm4) {
        filename = `${filename}.wasm4.wasm`;
      }

      const game: Nes = await createGame(filename, romBuffer, this.#sampleRate, this.#game!.maxPlayer);

      this.setState({ canvasWidth: game.width(), canvasHeight: game.height() });
      this.#gameInstance = game;
      if (this.#isHost) {
        this.hostRomBuffer = romBuffer;
      }
    } catch (err) {
      if (err?.name === 'AbortError') throw err;
      logger.error(err);
      throw new Error(typeof err === 'string' ? err : 'ROM load fail');
    }
    this.#nextStartTime = 0;
  };

  #onMessage = ({ detail }: CustomEvent<ChannelMessage | ArrayBuffer>) => {
    if (detail instanceof ArrayBuffer) {
      if (this.#gameInstance) {
        const memory = this.#gameInstance.mem();
        const qoiBuffer = new Uint8Array(detail);
        if (qoiBuffer.length <= 4) return;
        const part = new Uint8Array(detail, qoiBuffer.length - 4, 4);
        const framePtr = this.#gameInstance.decode_qoi(qoiBuffer);
        const frameLen = this.#gameInstance.decode_qoi_len();
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
        if (
          Object.values(newRoles).some(
            (role) => role?.userId && !roleIds.has(role.userId) && role.userId !== this.#userId,
          )
        ) {
          playHintSound('joined');
        }
        this.setState({ roles: { ...newRoles } });
        break;
      // host
      case ChannelMessageType.KEYDOWN:
        this.#gameInstance?.handle_button_event((detail as KeyDownMsg).player, (detail as KeyDownMsg).button, true);
        break;
      // host
      case ChannelMessageType.KEYUP:
        this.#gameInstance?.handle_button_event((detail as KeyDownMsg).player, (detail as KeyUpMsg).button, false);
        break;
      // host
      case ChannelMessageType.POINTER_MOVE:
        const { player, x, y, dx, dy } = detail as PointerMoveMsg;
        this.#gameInstance?.handle_motion_event(player, x, y, dx, dy);
        break;
    }
  };

  #initRtc = () => {
    this.#rtc = this.#isHost ? new RTCHost() : new RTCClient();
    this.#rtc.addEventListener('message', this.#onMessage);

    this.#rtc.start({
      host: this.#playing!.host,
      audio: this.audioRef.element!,
      stream: this.#createAudioStream(),
    });
  };

  #getGamepadButton = (event: KeyboardEvent | PointerEvent) => {
    const { keybinding } = this.#settings!;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const map: Record<string, Button> = {
      [keybinding.Up]: Button.JoypadUp,
      [keybinding.Left]: Button.JoypadLeft,
      [keybinding.Down]: Button.JoypadDown,
      [keybinding.Right]: Button.JoypadRight,
      [keybinding.A]: Button.JoypadA,
      [keybinding.B]: Button.JoypadB,
      [keybinding.C]: Button.JoypadC,
      [keybinding.TurboA]: Button.JoypadTurboA,
      [keybinding.TurboB]: Button.JoypadTurboB,
      [keybinding.TurboC]: Button.JoypadTurboC,
      [keybinding.Select]: Button.Select,
      [keybinding.Start]: Button.Start,
      [keybinding.Reset]: Button.Reset,
    };
    const map2: Record<string, Button> = {
      [keybinding.Up_2]: Button.JoypadUp,
      [keybinding.Left_2]: Button.JoypadLeft,
      [keybinding.Down_2]: Button.JoypadDown,
      [keybinding.Right_2]: Button.JoypadRight,
      [keybinding.A_2]: Button.JoypadA,
      [keybinding.B_2]: Button.JoypadB,
      [keybinding.C_2]: Button.JoypadC,
      [keybinding.TurboA_2]: Button.JoypadTurboA,
      [keybinding.TurboB_2]: Button.JoypadTurboB,
      [keybinding.TurboC_2]: Button.JoypadTurboC,
    };
    if (event instanceof PointerEvent) {
      const btn = mapPointerButton(event);
      return btn && { player: Player.One, btn };
    }
    const key = event.key.toLowerCase();
    if (key in map2) {
      return { player: Player.Two, btn: map2[key] };
    }
    if (key in map) {
      return { player: Player.One, btn: map[key] };
    }
  };

  #onPointerMove = (event: PointerEvent) => {
    this.playing = false;
    if (!this.#gameInstance) return;
    const [x, y, dx, dy] = positionMapping(event, this.canvasRef.element!);
    if (this.#isHost) {
      this.#gameInstance.handle_motion_event(Player.One, x, y, dx, dy);
    } else {
      this.#rtc?.send(new PointerMoveMsg(x, y, dx, dy));
    }
  };

  #pressButton = (player: Player, button: Button) => {
    if (button !== Button.PointerPrimary && button !== Button.PointerSecondary) {
      this.playing = true;
    }
    if (button === Button.Reset) {
      this.#gameInstance?.reset();
    } else {
      this.#enableAudio();
    }
    if (this.#isHost) {
      this.#gameInstance?.handle_button_event(player, button, true);
    } else {
      this.#rtc?.send(new KeyDownMsg(button));
    }
  };

  #onPressButton = (event: CustomEvent<CustomGamepadButton>) => {
    this.#pressButton(event.detail.player, event.detail.btn);
  };

  #onKeyDown = (event: KeyboardEvent) => {
    if (event.repeat) return;
    if (event.isComposing) return;
    const button = this.#getGamepadButton(event);
    if (button) {
      this.#pressButton(button.player, button.btn);
      event.stopPropagation();
    } else {
      hotkeys({
        enter: (event: KeyboardEvent) => {
          this.chatRef.element?.focus();
          event.stopPropagation();
        },
        ...this.state.cheatKeyHandles,
        ...this.state.comboKeyHandles,
      })(event);
    }
  };

  // fixed `setPointerCapture` stage
  #stopPropagation = (event: PointerEvent, onlyInputElement = false) => {
    if (!onlyInputElement || event.composedPath()[0] instanceof HTMLInputElement) {
      event.stopPropagation();
    }
  };

  #onPointerDown = (event: PointerEvent) => {
    const button = this.#getGamepadButton(event);
    if (!button) return;
    this.setPointerCapture(event.pointerId);
    this.#onPointerMove(event);
    this.#pressButton(button.player, button.btn);
  };

  #releaseButton = (player: Player, button: Button) => {
    if (this.#isHost) {
      this.#gameInstance?.handle_button_event(player, button, false);
    } else {
      this.#rtc?.send(new KeyUpMsg(button));
    }
  };

  #onReleaseButton = (event: CustomEvent<CustomGamepadButton>) => {
    this.#releaseButton(event.detail.player, event.detail.btn);
  };

  #onKeyUp = (event: KeyboardEvent) => {
    if (event.repeat) return;
    if (event.isComposing) return;
    const button = this.#getGamepadButton(event);
    if (!button) return;
    this.#releaseButton(button.player, button.btn);
  };

  #onPointerUp = (event: PointerEvent) => {
    const button = this.#getGamepadButton(event);
    if (!button) return;
    this.#releaseButton(button.player, button.btn);
  };

  #getMaskFactor = () => [
    !configure.windowHasFocus,
    configure.searchState,
    configure.settingsState,
    configure.friendListState,
  ];

  #hasMask = () => this.#getMaskFactor().every((e) => !e);

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
        if (!gameId || !cheatSettings) return;
        const cheats = (cheatSettings[gameId] || []).map((cheat) => parseCheatCode(cheat)).filter(isNotNullish);

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
      },
      () => [this.#playing?.gameId, this.#settings?.cheat],
    );

    this.memo(
      () => {
        const gameId = this.#playing?.gameId;
        const comboSettings = this.#settings?.combo;
        if (!gameId || !comboSettings) return;
        const combos = (comboSettings[gameId] || []).map((combo) => parseComboCode(combo));

        this.setState({
          combos,
          comboKeyHandles: Object.fromEntries(
            combos.map((combo) => [
              combo.combo.binding,
              (evt: KeyboardEvent) => {
                // only once combo
                if (this.#currentComboMap.size) return;
                this.#currentComboMap.set(combo, 0);
                evt.stopPropagation();
              },
            ]),
          ),
        });
      },
      () => [this.#playing?.gameId, this.#settings?.cheat],
    );

    this.effect(
      () => {
        if (this.#rom) {
          waitLoading(this.#loadRom(), {
            transparent: true,
            position: this.#hasMask() ? 'center' : 'start',
          });
        }
      },
      () => [this.#rom],
    );

    this.effect(() => {
      if (this.#hasMask()) {
        this.#resumeAudio();
        changeLoading({ position: 'center' });
      } else {
        this.#pauseAudio();
        changeLoading({ position: 'start' });
      }
    }, this.#getMaskFactor);

    this.addEventListener('pointermove', this.#onPointerMove);
    addEventListener('keydown', this.#onKeyDown);
    this.addEventListener('pointerdown', this.#onPointerDown);
    addEventListener('keyup', this.#onKeyUp);
    this.addEventListener('pointerup', this.#onPointerUp);
    addEventListener(globalEvents.PRESS_BUTTON, this.#onPressButton);
    addEventListener(globalEvents.RELEASE_BUTTON, this.#onReleaseButton);
    return () => {
      this.#abortController?.abort();
      this.#audioContext?.close();
      this.#rtc?.destroy();
      this.removeEventListener('pointermove', this.#onPointerMove);
      removeEventListener('keydown', this.#onKeyDown);
      this.removeEventListener('pointerdown', this.#onPointerDown);
      removeEventListener('keyup', this.#onKeyUp);
      this.removeEventListener('pointerup', this.#onPointerUp);
      removeEventListener(globalEvents.PRESS_BUTTON, this.#onPressButton);
      removeEventListener(globalEvents.RELEASE_BUTTON, this.#onReleaseButton);
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
        .filter=${this.#settings?.video.filter || VideoFilter.DEFAULT}
        style=${styleMap({
          padding: this.padding,
          imageRendering: this.#settings?.video.render || VideoRenderMethod.PIXELATED,
        })}
      ></nesbox-canvas>
      <audio ref=${this.audioRef.ref} hidden></audio>
      <m-room-chat
        class="chat"
        ref=${this.chatRef.ref}
        .messages=${messages}
        @pointerdown=${(evt: PointerEvent) => this.#stopPropagation(evt, true)}
        @submit=${({ detail }: CustomEvent<TextMsg>) => this.#rtc?.send(detail)}
      ></m-room-chat>
      <m-room-player-list
        class="player-list"
        .isHost=${this.#isHost}
        .roles=${roles}
        @pointerdown=${this.#stopPropagation}
        @rolechange=${({ detail }: CustomEvent<RoleOffer>) => this.#rtc?.send(detail)}
        @kickout=${({ detail }: CustomEvent<number>) => this.#rtc?.kickOutRole(detail)}
        @disableplayer=${({ detail }: CustomEvent<Player>) => this.#rtc?.disablePlayer(detail)}
      ></m-room-player-list>
    `;
  };

  getThumbnail = () => {
    return this.canvasRef.element!.captureThumbnail();
  };

  screenshot = () => {
    return this.canvasRef.element!.screenshot();
  };

  getStream = () => {
    const videoTrack = this.canvasRef.element!.captureVideoTrack();
    const audioTrack = this.#isHost
      ? this.#audioStreamDestination!.stream.getAudioTracks()[0]
      : (this.audioRef.element!.srcObject as MediaStream).getAudioTracks()[0];
    return {
      stream: new MediaStream([videoTrack, audioTrack]),
      stopStream: () => {
        videoTrack.stop();
      },
    };
  };

  getState = async (): Promise<GameState | undefined> => {
    if (!this.#gameInstance) return;
    // await jszip
    const state = await this.#gameInstance.state();
    if (state.length === 0) {
      const buffer = this.#gameInstance.mem().buffer;
      logger.warn(`Saved wasm memory: ${buffer.byteLength / 1024}KB`);
      return {
        type: gameStateType.WASM,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        ptr: String(this.#gameInstance.ptr),
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
    if (!this.#gameInstance) return;
    const stateArray = new Uint8Array(buffer);
    if (type === gameStateType.WASM) {
      const mem: WebAssembly.Memory = this.#gameInstance.mem();
      if (stateArray.length > mem.buffer.byteLength) {
        mem.grow((stateArray.length - mem.buffer.byteLength) / (64 * 1024));
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      this.#gameInstance.ptr = Number(ptr);
      new Uint8Array(mem.buffer).set(stateArray);
    } else {
      this.#gameInstance.load_state(stateArray);
    }
  };

  getRam = () => {
    if (!this.#gameInstance) return;
    // 兼容没有 ram_map 方法的 wasm 游戏
    try {
      return {
        bytes: this.#gameInstance.ram(),
        map: this.#gameInstance.ram_map(),
      };
    } catch (err) {
      logger.warn('Read ram error', err);
    }
  };
}

export type GameState = {
  type: string;
  buffer: ArrayBuffer;
  ptr?: string;
};

watchDevRom();
