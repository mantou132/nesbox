import { JSDOM } from 'jsdom';

import { agentFetch } from 'agent';
// eslint-disable-next-line no-console
const log = console.log;

const titleList = ['ja', 'zh', 'en', 'publish_date', 'publisher', 'platform'] as const;

export type Item = Record<(typeof titleList)[number], string>;

export async function fetchList() {
  const text = await agentFetch('https://www.retrowan.com/list-of-fc-fds-nes-games/');
  const { window } = new JSDOM(text);
  log(window.document.querySelector('article p')?.textContent);

  const items = [...window.document.querySelectorAll('article table tr')]
    .slice(1)
    .map((tr) =>
      [...tr.querySelectorAll('td')].reduce(
        (result, td, index) => Object.assign(result, { [titleList[index]]: td.textContent?.trim() || '' }),
        {} as Item,
      ),
    );

  const dup = (factor: (arg: any) => string) => {
    return Object.fromEntries(
      Object.entries(
        items
          .map(factor)
          .filter((e) => !!e)
          .reduce((p, c) => Object.assign(p, { [c]: (p[c] || 0) + 1 }), {} as Record<string, number>),
      ).filter(([_, count]) => count > 1),
    );
  };

  log(
    '中文名重合',
    dup((e) => e.zh),
  );
  log(
    '日文名重合',
    dup((e) => e.ja),
  );
  log(
    '英文名重合',
    dup((e) => e.en),
  );
  log(
    '中日英名重合',
    dup((e) => [e.en, e.zh, e.ja].join()),
  );

  log(
    'zh 重合',
    dup((e) => e.zh && [e.platform, e.publisher, e.zh].join()),
  );
  log(
    'en 重合',
    dup((e) => e.en && [e.platform, e.publisher, e.en].join()),
  );
  log(
    'ja 重合',
    dup((e) => e.ja && [e.platform, e.publisher, e.ja].join()),
  );

  log('有中日英名称', items.filter((e) => e.zh && e.ja && e.en).length);
  log('只有中英名称', items.filter((e) => e.zh && !e.ja && e.en).length);
  log('只有日英名称', items.filter((e) => !e.zh && e.ja && e.en).length);
  log('只有英名称', items.filter((e) => !e.zh && !e.ja && e.en).length);

  const pGroup: Record<string, number> = {};
  items.forEach((e) => (pGroup[e.platform] = (pGroup[e.platform] || 0) + 1));
  log(
    '平台',
    Object.entries(pGroup).sort((b, a) => a[1] - b[1]),
  );
  const publisherGroup: Record<string, number> = {};
  items.forEach((e) => (publisherGroup[e.publisher] = (publisherGroup[e.publisher] || 0) + 1));
  log(
    '发行商',
    Object.entries(publisherGroup).sort((b, a) => a[1] - b[1]),
  );

  return items;
}
