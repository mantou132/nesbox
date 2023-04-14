import { i18n } from 'src/i18n/basic';
import zhCN from 'src/locales/zh-CN/help.json';
import enURI from 'src/locales/en/help.json?url';
import jaURI from 'src/locales/ja/help.json?url';
import twURI from 'src/locales/zh-TW/help.json?url';

export type Locale = typeof zhCN;
export type LocaleKey = keyof Locale;

export const helpI18n = i18n.createSubModule<typeof zhCN>('help', {
  [i18n.fallbackLanguage]: zhCN,
  'zh-TW': twURI,
  en: enURI,
  ja: jaURI,
});
