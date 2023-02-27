import { writeFile } from 'fs/promises';
import { resolve } from 'path';

import { fetchList, Item } from 'list';
import { Game, get8BBitGames } from '8bbit';
import { fetchImage } from 'image';
import { fetchEnDes, fetchJaDes, fetchZhDes } from 'description';
import { existGames, incudesString, normalzile, removePunctuation } from 'utils';

import metadata2 from './metadata2.json';
import metadata1 from './metadata1.json';

export type Data = {
  title: string;
  description: string;
  cover: string;
  screenshots: string[];
  view: number;
};

const metadataMap = Object.fromEntries(metadata1.map((e: Data) => [e.title, e]));
const metadata2Map = Object.fromEntries(metadata2.map((e: Data) => [e.title, e]));

const metadata: Data[] = [...metadata2];

const write = () => writeFile(resolve(__dirname, 'metadata2.json'), JSON.stringify(metadata, null, 2));

const appendData = async (lang: keyof Item, item: Item, game: Game) => {
  const t = normalzile(item[lang]);
  if (!existGames.includes(t) && !metadataMap[t] && !metadata2Map[t]) {
    try {
      const description = (
        lang === 'ja'
          ? (await fetchJaDes(item[lang])) || ''
          : lang === 'zh'
          ? (await fetchZhDes(item[lang])) || ''
          : (await fetchEnDes(item[lang])) || game.wiki
      ).slice(0, 3000);

      const screenshots = (await fetchImage(item[lang])).slice(0, 10);

      metadata.push({
        title: t,
        cover: game.cover,
        view: game.view,
        description,
        screenshots,
      });
    } finally {
      await write();
    }
  }
};

const appendLanguagesData = async (item: Item, game: Game) => {
  if (item.ja) await appendData('ja', item, game);
  if (item.zh) await appendData('zh', item, game);
  if (item.en) await appendData('en', item, game);
};

async function main() {
  const list = await fetchList();
  const records = Object.fromEntries(list.map((e) => [e.en, e]));

  const games = await get8BBitGames();
  console.log(games.length, list.length);

  let i = 0;

  await games.reduce(async (p, game, index) => {
    await p;

    const item =
      records[game.title] ||
      list.find((e) => e.en && incudesString(e.en, game.title)) ||
      list.find((e) => e.en && incudesString(removePunctuation(e.en), removePunctuation(game.title)));

    if (item) {
      return await appendLanguagesData(item, game);
    }

    i++;
    console.log('missing', index, game.title, game.view);
  }, Promise.resolve());
  console.log('missing', i);
}

main();

process.on('SIGINT', async function () {
  await write();
  process.exit();
});
