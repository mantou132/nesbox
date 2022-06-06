import { updateStore } from '@mantou/gem';
import { isMac, getDisplayKey } from 'duoyun-ui/lib/hotkeys';
import { Modify } from 'duoyun-ui/lib/types';
import { createCacheStore } from 'duoyun-ui/lib/utils';

import { LoginMutation } from 'src/generated/guestgraphql';
import { localStorageKeys } from 'src/constants';
import type { ThemeName } from 'src/theme';
import { GetAccountQuery } from 'src/generated/graphql';

const defaultKeybinding = {
  Up: 'w',
  Left: 'a',
  Down: 's',
  Right: 'd',
  A: 'j',
  B: 'k',
  Select: 'u',
  Start: 'i',
};

export type Settings = {
  keybinding: typeof defaultKeybinding;
};

export type User = Modify<LoginMutation['login']['user'], { settings: Settings }>;

export const parseAccount = (account: GetAccountQuery['account']): User => {
  const settings = JSON.parse(account.settings || '{}');
  return {
    ...account,
    settings: { ...settings, keybinding: { ...defaultKeybinding, ...settings.keybinding } },
  };
};

export interface Profile {
  token: string;
  exp: number;
  nickname: string;
  username: string;
}

interface Shortcut {
  win: string[];
  mac: string[];
}

interface Configure {
  user?: User;
  profile?: Profile;
  screencastMode?: boolean;
  friendListState?: boolean;
  settingsState?: boolean;
  searchState?: boolean;
  friendChatState?: number;
  usedRelease?: number;
  theme: ThemeName;
  shortcuts: {
    OPEN_SEARCH: Shortcut;
    OPEN_SETTINGS: Shortcut;
  };
}

export const [configure, storeConfigure] = createCacheStore<Configure>(localStorageKeys.CONFIGURE_LOCAL_STORAGE_KEY, {
  theme: 'default',
  shortcuts: {
    OPEN_SEARCH: {
      win: ['ctrl', 'k'],
      mac: ['command', 'k'],
    },
    OPEN_SETTINGS: {
      win: ['esc'],
      mac: ['esc'],
    },
  },
});

export function getShortcut(command: keyof Configure['shortcuts'], isDisplay = false) {
  const keys = configure.shortcuts[command][isMac ? 'mac' : 'win'];
  if (isDisplay) return keys.map((key) => getDisplayKey(key)).join('');
  return keys.join('+');
}

export const deleteUser = () => {
  updateStore(configure, { user: undefined, profile: undefined });
};

export const toggoleScreencaseMode = () => {
  updateStore(configure, { screencastMode: !configure.screencastMode });
};

export const toggoleFriendListState = () => {
  updateStore(configure, { friendListState: !configure.friendListState });
};

export const toggoleFriendChatState = (id?: number) => {
  updateStore(configure, { friendChatState: id });
};

export const toggoleSettingsState = () => {
  updateStore(configure, { settingsState: !configure.settingsState });
};

export const toggoleSearchState = () => {
  updateStore(configure, { searchState: !configure.searchState });
};
