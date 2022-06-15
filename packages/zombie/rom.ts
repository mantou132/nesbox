import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import { readFileSync } from 'fs';

import * as puppeteer from 'puppeteer';

import metadata1 from './metadata1.json';
import metadata2 from './metadata2.json';

import { get8BBitGames } from '8bbit';
import { fetchList, Item } from 'list';
import { Data } from 'index';
import { existGames, incudesString, normalzile, removePunctuation } from 'utils';

const roms = JSON.parse(readFileSync('./roms.json', { encoding: 'utf-8' }));

const metadataMap = Object.fromEntries(metadata1.map((e: Data) => [e.title, e]));
const metadata2Map = Object.fromEntries(metadata2.map((e: Data) => [e.title, e]));

const write = async () => writeFile(resolve(__dirname, 'roms.json'), JSON.stringify(roms, null, 2));

const getData = (title: string) => metadataMap[normalzile(title)] || metadata2Map[normalzile(title)];

const setRom = (item: Item, rom: string) => {
  if (item.ja) Object.assign(roms, { [getData(item.ja).title]: rom });
  if (item.zh && !existGames.includes(normalzile(item.zh))) Object.assign(roms, { [getData(item.zh).title]: rom });
  if (item.en) Object.assign(roms, { [getData(item.en).title]: rom });
  write();
};

const rejectRequestPattern: string[] = [
  '/*.googlesyndication.com',
  '/*.doubleclick.net',
  '/*.amazon-adsystem.com',
  '/*.adnxs.com',
  '/*.google-analytics.com',
  '/*.yandex.ru',
  '/*.cpmstar.com',
  '/*.google.com',
  '/*.gstatic.com',
  '/*.cloudflare.com',
  '/*.googleapis.com',
];

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setRequestInterception(true);

  page.on('request', (request) => {
    const url = request.url();
    console.log(url);
    if (
      url.endsWith('.jpg') ||
      url.endsWith('.gif') ||
      url.endsWith('.png') ||
      url.endsWith('.woff2') ||
      url.endsWith('.mp4') ||
      rejectRequestPattern.find((pattern) => url.match(pattern))
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });

  const list = await fetchList();
  const records = Object.fromEntries(list.map((e) => [e.en, e]));

  const games = await get8BBitGames();

  await games.reduce(async (p, game, index) => {
    await p;

    const item =
      records[game.title] ||
      list.find((e) => e.en && incudesString(e.en, game.title)) ||
      list.find((e) => e.en && incudesString(removePunctuation(e.en), removePunctuation(game.title)));

    if (!item) return;

    const data = getData(item.en);
    if ((roms as Record<string, string>)[data.title]) return;

    console.log(index, data.title);

    await page.goto(game.playurl);
    await page.click('.button.large.red');
    page
      .frames()
      .find((frame) => frame.url() === 'http://www.8bbit.com/ifr.html')!
      .evaluate(() => {
        const start = () =>
          [...document.querySelectorAll('p')]
            .find((element) => getComputedStyle(element, '::after').content === '"Start Game"')
            ?.click();
        if (document.readyState === 'complete') {
          start();
        } else {
          document.addEventListener('readystatechange', start);
        }
      });
    const zip = await new Promise<string>((res) =>
      page.on('request', (req) => {
        const url = req.url();
        if (url.endsWith('.zip')) {
          res(url);
        }
      }),
    );
    setRom(item, zip);
  }, Promise.resolve());

  await browser.close();
})();

process.on('SIGINT', async function () {
  await write();
  process.exit();
});
