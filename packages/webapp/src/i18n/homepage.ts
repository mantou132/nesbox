import { i18n } from 'src/i18n/basic';
import enURI from 'src/locales/en/homepage.json?url';
import jaURI from 'src/locales/ja/homepage.json?url';
import zhCN from 'src/locales/zh-CN/homepage.json';
import twURI from 'src/locales/zh-TW/homepage.json?url';

export type Locale = typeof zhCN;
export type LocaleKey = keyof Locale;

export const homepageI18n = i18n.createSubModule<typeof zhCN>('homepage', {
  [i18n.fallbackLanguage]: zhCN,
  'zh-TW': twURI,
  en: enURI,
  ja: jaURI,
});
