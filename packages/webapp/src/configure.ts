import { updateStore } from '@mantou/gem';
import { isMac, getDisplayKey } from 'duoyun-ui/lib/hotkeys';

import { LoginMutation } from 'src/generated/guestgraphql';
import { localStorageKeys } from 'src/constants';
import type { ThemeName } from 'src/theme';
import { createCacheStore } from 'src/utils';

export type User = LoginMutation['login']['user'];

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
  usedRelease?: number;
  theme: ThemeName;
  shortcuts: {
    OPEN_HELP: Shortcut;
  };
}

export const [configure, storeConfigure] = createCacheStore<Configure>(localStorageKeys.CONFIGURE_LOCAL_STORAGE_KEY, {
  theme: 'light',
  shortcuts: {
    OPEN_HELP: {
      win: ['ctrl', 'shift', 'k'],
      mac: ['command', 'shift', 'k'],
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
