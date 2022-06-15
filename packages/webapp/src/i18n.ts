import { I18n } from '@mantou/gem/helper/i18n';
import { updateLocale } from 'duoyun-ui/lib/locale';

import zhCN from 'src/locales/templates/messages.json';
import enURI from 'src/locales/en/messages.json?url';
import twURI from 'src/locales/zh-TW/messages.json?url';
import jaURI from 'src/locales/ja/messages.json?url';

const fallbackLanguage = 'zh-CN';

export const langNames: Record<string, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁体中文',
  en: 'English',
  ja: '日本語',
};

export type Locale = typeof zhCN;
export type LocaleKey = keyof Locale;

export const i18n = new I18n<typeof zhCN>({
  fallbackLanguage,
  cache: true,
  resources: {
    [fallbackLanguage]: zhCN,
    'zh-TW': twURI,
    en: enURI,
    ja: jaURI,
  },
  onChange: async (code: keyof typeof langNames) => {
    switch (code) {
      case 'zh-CN':
      case 'zh-TW':
        return updateLocale(import('duoyun-ui/locales/zh'));
      case 'en':
      default:
        return updateLocale(import('duoyun-ui/locales/en'));
    }
  },
});
