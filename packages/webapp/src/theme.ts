import { updateTheme as updateDuoyunTheme, darkTheme } from 'duoyun-ui/lib/theme';
import { updateStore } from '@mantou/gem';
import { createTheme, getThemeStore, updateTheme } from '@mantou/gem/helper/theme';

import { configure } from 'src/configure';
import { i18n } from 'src/i18n';

export const themeNames = {
  get default() {
    return i18n.get('defaultTheme');
  },
};

export type ThemeName = keyof typeof themeNames;

export const defaultTheme = {
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
  mainWidth: '90em',
};
export const theme = createTheme({ ...defaultTheme });

export const themeStore = getThemeStore(theme);

export function changeTheme(name: ThemeName) {
  updateStore(configure, { theme: name });
  updateTheme(theme, name === 'default' ? defaultTheme : {});
}

updateDuoyunTheme(theme);
