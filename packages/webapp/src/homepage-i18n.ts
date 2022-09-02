import { i18n } from 'src/i18n';
import zhCN from 'src/locales/templates/homepage-message.json';
import enURI from 'src/locales/en/homepage-message.json?url';
import twURI from 'src/locales/zh-TW/homepage-message.json?url';
import jaURI from 'src/locales/ja/homepage-message.json?url';

export type Locale = typeof zhCN;
export type LocaleKey = keyof Locale;

export const homepageI18n = i18n.createSubModule<typeof zhCN>('homepage', {
  [i18n.fallbackLanguage]: zhCN,
  'zh-TW': twURI,
  en: enURI,
  ja: jaURI,
});
