import { JSDOM } from 'jsdom';

import { agentFetch } from 'agent';

async function fetchSearchLink(search: string, site: string) {
  const text = await agentFetch(
    `https://www.google.com/search?q=${`${search} nes fc site:${site}`.replaceAll(' ', '+')}`,
  );
  const { window } = new JSDOM(text);
  return (window.document.querySelector(`a[href^=${site.replace(/(:|\.|\/)/g, '\\$1')}]`) as null | HTMLAnchorElement)
    ?.href;
}

export async function fetchEnDes(search: string) {
  const href = await fetchSearchLink(search, 'https://www.mobygames.com');
  if (!href) return;
  const { window } = new JSDOM(await agentFetch(href));
  let ele: Node | null = window.document.querySelector('h2');
  let result = '';
  while (true) {
    if (!ele) return;
    ele = ele.nextSibling;
    if (!ele || (ele instanceof window.HTMLElement && ele.classList.contains('sideBarLinks'))) {
      return result;
    }

    if (ele instanceof window.HTMLBRElement) {
      result += '\n';
    } else {
      result += ele.textContent;
    }
  }
}

export async function fetchJaDes(search: string) {
  const href = await fetchSearchLink(search, 'https://dic.pixiv.net');
  if (!href) return;
  const { window } = new JSDOM(await agentFetch(href));
  const p = window.document.querySelector('section p');
  return p?.textContent?.trim();
}

export async function fetchZhDes(search: string) {
  const href = await fetchSearchLink(search, 'https://zh.wikipedia.org');
  if (!href) return;
  const { window } = new JSDOM(await agentFetch(href));
  const p = [
    ...(window.document.querySelector('#mw-content-text')?.querySelector('.mw-parser-output')?.querySelectorAll('p') ||
      []),
  ].slice(0, 3);
  return p
    .map((e) => e.textContent || '')
    .filter((e) => !!e)
    .join('\n\n')
    .replace(/\[\d\]/g, '');
}
