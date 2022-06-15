// http://www.8bbit.com/page/95?ch=all&per-page=16

import { JSDOM } from 'jsdom';

import result from '8bbit.json';

export type Game = { title: string; cover: string; wiki: string; view: number; playurl: string };

const parseView = (str: string) => {
  if (str.endsWith('m')) {
    return parseFloat(str) * 1_000_000;
  }
  if (str.endsWith('k')) {
    return parseFloat(str) * 1_000;
  }
  return parseFloat(str);
};

export async function get8BBitGames() {
  return Object.values(result)
    .map((page) => {
      const { window } = new JSDOM(page);
      return [...window.document.querySelectorAll('article')].map<Game>((article) => ({
        title: article.querySelector('h1 a')!.getAttribute('title') || '',
        cover: new URL(article.querySelector('img')!.src, 'http://www.8bbit.com').href,
        wiki: article.querySelector('[id^=wiki]')?.textContent?.trim() || '',
        view: parseView(article.querySelector('.meta-view')!.textContent!.trim()),
        playurl: new URL(
          `/play${article.querySelector('a')?.pathname}/${article.id.replace('post-', '')}`,
          'http://www.8bbit.com',
        ).href,
      }));
    })
    .flat()
    .sort((a, b) => b.view - a.view);
}
