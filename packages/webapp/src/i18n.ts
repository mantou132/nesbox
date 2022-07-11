import { I18n } from '@mantou/gem/helper/i18n';
import { updateLocale } from 'duoyun-ui/lib/locale';

import { ScGame } from 'src/generated/graphql';
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

const jaRegExp = /\p{sc=Katakana}|\p{sc=Hiragana}/u;
const jaDescRegExp = /(\p{sc=Katakana}|\p{sc=Hiragana}){5}/gu;
const zhRegExp = /\p{sc=Han}/u;
export const isCurrentLang = (game: Pick<ScGame, 'name' | 'description'>) => {
  const lang =
    jaRegExp.test(game.name) || Number(game.description.match(jaDescRegExp)?.length) > 2
      ? 'ja'
      : zhRegExp.test(game.name)
      ? 'zh'
      : 'en';
  return lang === i18n.currentLanguage.split('-').shift()?.toLowerCase();
};
