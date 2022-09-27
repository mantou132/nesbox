import { updateTheme as updateDuoyunTheme, darkTheme } from 'duoyun-ui/lib/theme';
import { updateStore } from '@mantou/gem';
import { createTheme, getThemeStore, updateTheme } from '@mantou/gem/helper/theme';
import { mediaQuery } from '@mantou/gem/helper/mediaquery';
import { isMtApp } from 'mt-app';

import { configure } from 'src/configure';
import { i18n } from 'src/i18n';

export const themeNames = {
  get default() {
    return i18n.get('defaultTheme');
  },
  get punk() {
    return i18n.get('punkTheme');
  },
  get retro() {
    return i18n.get('retroTheme');
  },
};

export type ThemeName = keyof typeof themeNames;

const defaultTheme = {
  ...darkTheme,
  primaryColor: '#4adf67',
  highlightColor: '#efefef',
  textColor: '#eee',
  describeColor: '#777',
  backgroundColor: '#1a1a1a',
  lightBackgroundColor: '#1e1e1e',
  hoverBackgroundColor: '#2f2f2f',
  borderColor: '#515151',
  disabledColor: '#333',
  titleBarColor: '#000',
  imageFilter: 'none',
  maskAlpha: '0.4',
  // same of light/dark
  // https://spectrum.adobe.com/page/color/#Semantic-colors
  informativeColor: '#2680eb',
  neutralColor: '#b3b3b3',
  positiveColor: '#2d9d78',
  noticeColor: '#e68619',
  negativeColor: '#e34850',
  focusColor: '#2680eb',
  normalRound: '10px',
  smallRound: '4px',
  gridGutter: '24px',
  popupZIndex: '2147483644',
  timingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  timingEasingFunction: 'cubic-bezier(0.16, 1, 0.29, 0.99)',
  ...(isMtApp
    ? {
        normalRound: '0',
        smallRound: '0',
      }
    : {}),
  ...(isMtApp || mediaQuery.isPhone
    ? {
        gridGutter: '16px',
      }
    : {}),
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
  imageFilter: 'saturate(110%)',
  maskAlpha: '0.6',
  normalRound: '0',
  smallRound: '0',
};

const retroTheme = {
  primaryColor: '#ef9017',
  highlightColor: '#f4e6d9',
  textColor: '#f4e6d9',
  describeColor: '#817971',
  backgroundColor: '#141310',
  lightBackgroundColor: '#1e1e1a',
  hoverBackgroundColor: '#2f2f2a',
  borderColor: '#515151',
  disabledColor: '#333',
  titleBarColor: '#000',
  imageFilter: 'grayscale(0.1) contrast(90%) saturate(90%)',
  maskAlpha: '0.5',
  normalRound: '0',
  smallRound: '0',
};

export const theme = createTheme({ ...defaultTheme });

export const themeStore = getThemeStore(theme);

export function changeTheme(name: ThemeName) {
  updateStore(configure, { theme: name });
  switch (name) {
    case 'punk':
      updateTheme(theme, punkTheme);
      break;
    case 'retro':
      updateTheme(theme, retroTheme);
      break;
    case 'default':
      updateTheme(theme, defaultTheme);
      break;
  }
  updateDuoyunTheme(themeStore);
}

changeTheme(configure.theme);
