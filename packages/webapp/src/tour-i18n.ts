import { i18n } from 'src/i18n';
import zhCN from 'src/locales/templates/tour-message.json';
import enURI from 'src/locales/en/tour-message.json?url';
import jaURI from 'src/locales/ja/tour-message.json?url';
import twURI from 'src/locales/zh-TW/tour-message.json?url';

export type Locale = typeof zhCN;
export type LocaleKey = keyof Locale;

export const tourI18n = i18n.createSubModule<typeof zhCN>('tour', {
  [i18n.fallbackLanguage]: zhCN,
  'zh-TW': twURI,
  en: enURI,
  ja: jaURI,
});
