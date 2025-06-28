import { createStore } from '@mantou/gem';
import { I18n } from '@mantou/gem/helper/i18n';
import { loadLocale } from 'duoyun-ui/lib/locale';
import type { ScGame } from 'src/generated/graphql';
import enURI from 'src/locales/en/basic.json?url';
import jaURI from 'src/locales/ja/basic.json?url';
import zhCN from 'src/locales/zh-CN/basic.json';
import twURI from 'src/locales/zh-TW/basic.json?url';

const fallbackLanguage = 'zh-CN';

export const langNames: Record<string, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁体中文',
  en: 'English',
  ja: '日本語',
};

export type Locale = typeof zhCN;
export type LocaleKey = keyof Locale;

export const i18nStore = createStore({});

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
    i18nStore();
    switch (code) {
      case 'zh-CN':
      case 'zh-TW':
        return loadLocale(import('duoyun-ui/locales/zh'));
      default:
        return loadLocale(import('duoyun-ui/locales/en'));
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
