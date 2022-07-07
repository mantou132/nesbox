export const RELEASE = Number(process.env.RELEASE);
// https://vitejs.dev/guide/api-javascript.html#resolveconfig
export const COMMAND = process.env.COMMAND as 'serve' | 'build';

export const isTauriMacApp = navigator.appName === 'nesbox-macos';
export const isTauriWinApp = navigator.appName === 'nesbox-windows';

export const githubIssue = 'https://github.com/mantou132/nesbox/issues';

export const paramKeys = {
  ROOM_ID: 'rid',
  GAME_ID: 'gid',
};

export const events = {
  SINGAL: 'singal',
  PRESS_BUTTON: 'pressbutton',
  RELEASE_BUTTON: 'releasebutton',
};

export const queryKeys = {
  REDIRECT_URI: 'redirect_uri',
  JOIN_ROOM: 'join_room',
};

// clean outdate cache data
['configure_v3', 'configure_v4'].forEach((key) => localStorage.removeItem(key));
export const localStorageKeys = {
  CONFIGURE_LOCAL_STORAGE_KEY: 'configure_v5',
  STORE_LOCAL_STORAGE_KEY: 'store_v2',
  FRIEND_CHAT_STORAGE_KEY: 'friend_chat_v2',
};

export enum SingalType {
  OFFER = 'offer',
  ANSWER = 'answer',
  NEW_ICE_CANDIDATE = 'new-ice-candidate',
}
export type Singal = {
  type: SingalType;
  data: any;
};
export type SingalEvent = {
  userId: number;
  singal: Singal;
};

// https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering
export const enum VideoRenderMethod {
  PIXELATED = 'pixelated',
  SMOOTH = 'smooth',
}

export const enum VideoFilter {
  DEFAULT = 'default',
  NTSC = 'NTSC',
}
