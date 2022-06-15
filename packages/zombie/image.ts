import { Script } from 'vm';

import { JSDOM } from 'jsdom';

import { agentFetch } from 'agent';

export async function fetchImage(search: string) {
  const text = await agentFetch(
    `https://www.google.com/search?q=${`${search} FC NES game screenshots`.replaceAll(
      ' ',
      '+',
    )}&newwindow=1&client=firefox-b-d&sxsrf=ALiCzsY6b616QHZBEChAK2Op-b-jPQR4WA:1655400400964&source=lnms&tbm=isch&sa=X&ved=2ahUKEwiQ6PCGv7L4AhUTat4KHbltApkQ_AUoBHoECAEQBg&biw=1136&bih=642&dpr=2`,
  );
  const { window } = new JSDOM(text);
  const str = [...window.document.querySelectorAll('script')]
    .map((e) => e.textContent || '')
    .find((e) => e.length > 1000 && e.trim().startsWith('AF_initDataCallback'))!;
  const objText = str.match(/^AF_initDataCallback(.*);\s*$/)![1];
  const obj = new Script(objText).runInThisContext();
  return (obj.data[31][0][12][2] as any[])
    .filter((e) => !!e[1])
    .map((e) => e[1][3])
    .map(([url, height, width]: [string, number, number]) => {
      let score = 0;
      if (/mario|nintendo|fandom|game|rom|nes|fc|bit/.test(url)) score += 1;
      if (width >= 256 && width < 1240) score += 1;

      score += 1 - Math.abs(256 / 240 - width / height);
      return { url, width, height, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((e) => e.url)
    .filter((e) => e.startsWith('http'));
}
