import { I18n } from '@mantou/gem/helper/i18n';
import { updateLocale } from 'duoyun-ui/lib/locale';

import zhCN from 'src/locales/templates/messages.json';
import enURI from 'src/locales/en/messages.json?url';
import twURI from 'src/locales/zh-TW/messages.json?url';

const fallbackLanguage = 'zh-CN';

export const langNames: Record<string, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁体中文',
  en: 'English',
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
  },
  onChange: async (code: keyof typeof langNames) => {
    switch (code) {
      case 'en':
        return updateLocale(import('duoyun-ui/locales/en'));
      case 'zh-CN':
      case 'zh-TW':
        return updateLocale(import('duoyun-ui/locales/zh'));
    }
  },
});
