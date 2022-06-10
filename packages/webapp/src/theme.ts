import { updateTheme as updateDuoyunTheme, darkTheme } from 'duoyun-ui/lib/theme';
import { updateStore } from '@mantou/gem';
import { createTheme, getThemeStore, updateTheme } from '@mantou/gem/helper/theme';

import { configure } from 'src/configure';
import { i18n } from 'src/i18n';

export const themeNames = {
  get default() {
    return i18n.get('defaultTheme');
  },
  get punk() {
    return i18n.get('punkTheme');
  },
};

export type ThemeName = keyof typeof themeNames;

const defaultTheme = {
  ...darkTheme,
  primaryColor: '#4adf67',
  highlightColor: '#efefef',
  textColor: '#eee',
  describeColor: '#616161',
  backgroundColor: '#1a1a1a',
  lightBackgroundColor: '#1e1e1e',
  hoverBackgroundColor: '#2f2f2f',
  borderColor: '#313131',
  disabledColor: '#5b5b5b',
  titleBarColor: '#000',
  maskAlpha: '0.5',
  // same of light/dark
  // https://spectrum.adobe.com/page/color/#Semantic-colors
  informativeColor: '#2680eb',
  neutralColor: '#b3b3b3',
  positiveColor: '#2d9d78',
  noticeColor: '#e68619',
  negativeColor: '#e34850',
  focusColor: '#2680eb',
  normalRound: '0px',
  smallRound: '0px',
  gridGutter: '24px',
  popupZIndex: '2147483646',
  timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  timingEasingFunction: 'cubic-bezier(0.16, 1, 0.29, 0.99)',
  titleBarHeight: '0px',
};

const punkTheme = {
  primaryColor: '#d4580e',
  highlightColor: '#fdfefe',
  textColor: '#ffe31d',
  describeColor: '#8196cf',
  backgroundColor: '#0b1e50',
  lightBackgroundColor: '#0a1d64',
  hoverBackgroundColor: '#0e2c73',
  borderColor: '#222b89',
  disabledColor: '#54566f',
  titleBarColor: '#0d0f1e',
  maskAlpha: '0.5',
};

export const theme = createTheme({ ...defaultTheme });

export const themeStore = getThemeStore(theme);

export function changeTheme(name: ThemeName) {
  updateStore(configure, { theme: name });
  switch (name) {
    case 'punk':
      updateTheme(theme, punkTheme);
      break;
    case 'default':
      updateTheme(theme, defaultTheme);
      break;
  }
  updateDuoyunTheme(themeStore);
}

changeTheme(configure.theme);

export function updatePartialTheme(t: Partial<typeof defaultTheme>) {
  updateTheme(theme, t);
}
