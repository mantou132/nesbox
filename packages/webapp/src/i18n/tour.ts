import { i18n } from 'src/i18n/basic';
import zhCN from 'src/locales/zh-CN/tour.json';
import enURI from 'src/locales/en/tour.json?url';
import jaURI from 'src/locales/ja/tour.json?url';
import twURI from 'src/locales/zh-TW/tour.json?url';

export type Locale = typeof zhCN;
export type LocaleKey = keyof Locale;

export const tourI18n = i18n.createSubModule<typeof zhCN>('tour', {
  [i18n.fallbackLanguage]: zhCN,
  'zh-TW': twURI,
  en: enURI,
  ja: jaURI,
});
