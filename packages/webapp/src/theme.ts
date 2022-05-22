import { updateTheme, darkTheme, lightTheme } from 'duoyun-ui/lib/theme';
import { updateStore } from '@mantou/gem';

import { configure } from 'src/configure';
import { i18n } from 'src/i18n';

export const themeNames = {
  get auto() {
    return i18n.get('sidebarAutoTheme');
  },
  get dark() {
    return i18n.get('sidebarDarkTheme');
  },
  get light() {
    return i18n.get('sidebarLightTheme');
  },
};

export type ThemeName = keyof typeof themeNames;

const media = matchMedia('(prefers-color-scheme: dark)');

media.addEventListener('change', ({ matches }) => {
  if (configure.theme === 'auto') {
    change(matches);
  }
});

function change(isDark: boolean) {
  updateTheme(isDark ? darkTheme : lightTheme);
}

function detect() {
  if (configure.theme !== 'auto') {
    change(configure.theme === 'dark');
  } else {
    change(media.matches);
  }
}

export function changeTheme(theme: ThemeName) {
  updateStore(configure, { theme });
  detect();
}

detect();
