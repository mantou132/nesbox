import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { isMtApp } from 'mt-app';

import type { Button, Player } from '@mantou/nes';
import type { ValueOf } from 'duoyun-ui/lib/types';
import type { GamepadBtnIndex } from 'src/gamepad';

export const RELEASE = Number(process.env.RELEASE);
// https://vitejs.dev/guide/api-javascript.html#resolveconfig
export const COMMAND = process.env.COMMAND as 'serve' | 'build';

export const isTauriMacApp = navigator.appName === 'nesbox-macos';
export const isTauriWinApp = navigator.appName === 'nesbox-windows';
export const isApp = window.__TAURI__ || mediaQuery.isPWA || isMtApp;

export const githubUrl = 'https://github.com/mantou132/nesbox';
export const githubIssue = `${githubUrl}/issues`;
export const githubRelease = `${githubUrl}/releases`;

export const paramKeys = {
  ROOM_ID: 'rid',
  GAME_ID: 'gid',
};

export const viewTransitionName = {
  PREVIEW: 'game-preview',
  HEADER: 'main-header',
  MAIN: 'main',
};

export const gameStateType = {
  WASM: 'wasm-memory',
  NORMAL: 'normal',
};

export const globalEvents = {
  SIGNAL: 'signal',
  VOICE_SIGNAL: 'voice-signal',
  PRESS_BUTTON: 'pressbutton',
  RELEASE_BUTTON: 'releasebutton',
  PRESS_HOST_BUTTON_INDEX: 'pressbutton-index',
  RELEASE_HOST_BUTTON_INDEX: 'releasebutton-index',
  CLOSE_SETTINGS: 'close-settings',
} as const;

interface CustomEventDetailMap {
  [globalEvents.SIGNAL]: SignalDetail;
  [globalEvents.VOICE_SIGNAL]: VoiceSignalDetail;
  [globalEvents.PRESS_BUTTON]: CustomGamepadButton;
  [globalEvents.RELEASE_BUTTON]: CustomGamepadButton;
  [globalEvents.PRESS_HOST_BUTTON_INDEX]: GamepadBtnIndex;
  [globalEvents.RELEASE_HOST_BUTTON_INDEX]: GamepadBtnIndex;
  [globalEvents.CLOSE_SETTINGS]: null;
}

export function dispatchGlobalEvent<K extends ValueOf<typeof globalEvents>, T = CustomEventDetailMap[K]>(
  type: K,
  detail: T,
) {
  dispatchEvent(new CustomEvent<T>(type, { detail }));
}

declare global {
  function addEventListener<K extends ValueOf<typeof globalEvents>>(
    type: K,
    listener: (this: Window, ev: CustomEvent<CustomEventDetailMap[K]>) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
}

export type CustomGamepadButton = {
  player: Player;
  btn: Button;
};

export enum SignalType {
  OFFER = 'offer',
  ANSWER = 'answer',
  NEW_ICE_CANDIDATE = 'new-ice-candidate',
}

export type Signal = {
  type: SignalType;
  data: any;
};

export type SignalDetail = {
  userId: number;
  signal: Signal;
};

export type VoiceSignalDetail = {
  roomId: number;
  signal: (RTCSessionDescriptionInit & { senderTrackIds: string[] }) | RTCIceCandidateInit;
};

export enum BcMsgType {
  RAM_REQ = 'ram-req',
  RAM_RES = 'ram-res',
}

export type BcMsgEvent = {
  id: string;
  type: BcMsgType;
  data?: Uint8Array;
};

export const queryKeys = {
  RECENT_GAMES: 'recent',
  REDIRECT_URI: 'redirect_uri',
  JOIN_ROOM: 'join_room',
  ROOM_FROM: 'room_from',
  GAME_KIND: 'game_kind',
  GAME_PLAYER: 'game_player',
  GAME_SERIES: 'game_series',
};

// clean outdate cache data
['configure_v3', 'configure_v4'].forEach((key) => localStorage.removeItem(key));
export const localStorageKeys = {
  CONFIGURE_LOCAL_STORAGE_KEY: 'configure_v6',
  STORE_LOCAL_STORAGE_KEY: 'store_v2',
  FRIEND_CHAT_STORAGE_KEY: 'friend_chat_v2',
};

// https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering
export const enum VideoRenderMethod {
  PIXELATED = 'pixelated',
  SMOOTH = 'smooth',
}

export const enum VideoFilter {
  DEFAULT = 'default',
  NTSC = 'NTSC',
  CRT = 'CRT',
}

export const enum VideoRefreshRate {
  AUTO = 'auto',
  FIXED = 'fixed',
  SYNC = 'sync',
}

export const enum RTCTransportType {
  CLIP = 'clip',
  REDUCE = 'reduce',
}

export const pixelFont = new FontFace(
  'Common Pixel',
  `local('Common Pixel'), url('/fonts/COMMP___.woff') format('woff')`,
  { weight: '400' },
);
