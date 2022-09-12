import { updateStore } from '@mantou/gem';
import { isMac, getDisplayKey } from 'duoyun-ui/lib/hotkeys';
import { Modify } from 'duoyun-ui/lib/types';
import { createCacheStore } from 'duoyun-ui/lib/utils';

import { LoginMutation } from 'src/generated/guestgraphql';
import { events, localStorageKeys, VideoFilter, VideoRenderMethod } from 'src/constants';
import type { ThemeName } from 'src/theme';
import { GetAccountQuery } from 'src/generated/graphql';

export const defaultKeybinding = {
  Up: 'w',
  Left: 'a',
  Down: 's',
  Right: 'd',
  A: 'j',
  B: 'k',
  TurboA: 'n',
  TurboB: 'm',
  Select: 'u',
  Start: 'i',
  Reset: 'r',

  Up_2: 'arrowup',
  Left_2: 'arrowleft',
  Down_2: 'arrowdown',
  Right_2: 'arrowright',
  A_2: '5',
  B_2: '6',
  TurboA_2: '8',
  TurboB_2: '9',
};

const defaultVolume = {
  hint: 0.1,
  notification: 0.5,
  game: 0.5,
};

const defaultShortcuts = {
  QUICK_REPLY: {
    win: ['.'],
    mac: ['.'],
  },
  OPEN_SEARCH: {
    win: ['ctrl', 'k'],
    mac: ['command', 'k'],
  },
  OPEN_HELP: {
    win: ['ctrl', 'h'],
    mac: ['command', 'h'],
  },
  OPEN_SETTINGS: {
    win: ['esc'],
    mac: ['esc'],
  },
  SCREENSHOT: {
    win: ['ctrl', 'shift', 's'],
    mac: ['command', 'shift', 's'],
  },
  SAVE_GAME_STATE: {
    win: ['ctrl', 's'],
    mac: ['command', 's'],
  },
  LOAD_GAME_STATE: {
    win: ['ctrl', 'l'],
    mac: ['command', 'l'],
  },
  OPEN_RAM_VIEWER: {
    win: ['ctrl', 'shift', 'd'],
    mac: ['command', 'shift', 'd'],
  },
  OPEN_CHEAT_SETTINGS: {
    win: ['ctrl', 'shift', 'c'],
    mac: ['command', 'shift', 'c'],
  },
};

const defaultVideoSettings = {
  render: VideoRenderMethod.PIXELATED,
  filter: VideoFilter.DEFAULT,
};

export type Cheat = { code: string; enabled: boolean; toggleKey: string; comment: string };

export type Settings = {
  keybinding: typeof defaultKeybinding;
  volume: typeof defaultVolume;
  shortcuts: typeof defaultShortcuts;
  video: typeof defaultVideoSettings;
  cheat: Record<number, Cheat[] | undefined>;
  tourIndex: number;
};

export type User = Modify<LoginMutation['login']['user'], { settings: Settings }>;

const mergeSettings = <T extends Record<string, unknown>>(defaultValue: T, originValue: T) => {
  return Object.entries(defaultValue).reduce(
    (p, [k, v]) => Object.assign(p, { [k]: originValue && k in originValue ? originValue[k] : v }),
    {} as T,
  );
};
export const parseAccount = (account: GetAccountQuery['account']): User => {
  const settings: Settings = JSON.parse(account.settings || '{}');
  return {
    ...account,
    settings: {
      ...settings,
      keybinding: mergeSettings(defaultKeybinding, settings.keybinding),
      volume: mergeSettings(defaultVolume, settings.volume),
      shortcuts: mergeSettings(defaultShortcuts, settings.shortcuts),
      video: mergeSettings(defaultVideoSettings, settings.video),
      cheat: settings.cheat || {},
      tourIndex: settings.tourIndex || 0,
    },
  };
};

export interface Profile {
  token: string;
  exp: number;
  nickname: string;
  username: string;
}

// only char
export enum SearchCommand {
  HELP = '?',
  SELECT_GAME = '~',
}

interface Configure {
  user?: User;
  profile?: Profile;
  screencastMode?: boolean;
  friendListState?: boolean;
  settingsState?: boolean;
  searchCommand?: SearchCommand;
  searchState?: boolean;
  usedRelease?: number;
  openNesFile?: File;
  theme: ThemeName;
}

export const [configure] = createCacheStore<Configure>(
  localStorageKeys.CONFIGURE_LOCAL_STORAGE_KEY,
  {
    theme: 'default',
  },
  { cacheExcludeKeys: ['openNesFile'] },
);

export function getShortcut(command: keyof typeof defaultShortcuts, isDisplay = false) {
  const keys = configure.user?.settings.shortcuts[command][isMac ? 'mac' : 'win'];
  if (!keys) return '';
  if (isDisplay) return keys.map((key) => getDisplayKey(key)).join(' ');
  return keys.join('+');
}

export const deleteUser = () => {
  updateStore(configure, { user: undefined, profile: undefined });
};

export const toggleScreencaseMode = () => {
  updateStore(configure, { screencastMode: !configure.screencastMode });
};

export const toggleFriendListState = () => {
  updateStore(configure, { friendListState: !configure.friendListState });
};

export const toggleSettingsState = () => {
  updateStore(configure, { settingsState: !configure.settingsState });
  if (!configure.settingsState) dispatchEvent(new CustomEvent(events.CLOSE_SETTINGS));
};

export const toggleSearchState = () => {
  updateStore(configure, {
    searchState: !configure.searchState,
    searchCommand: configure.searchState ? undefined : configure.searchCommand,
  });
};

export const setSearchCommand = (command: SearchCommand | null) => {
  updateStore(configure, { searchCommand: command || undefined, searchState: true });
};

export const setNesFile = (file?: File) => {
  updateStore(configure, { openNesFile: file });
};
