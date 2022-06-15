import fs from 'fs';

const metadata1 = require('./metadata1.json');
const metadata2 = require('./metadata2.json');
const metadata3 = require('./metadata3.json');
const roms = require('./roms.json');

const download = require('download');

const metadata = [...metadata1, ...metadata2, ...metadata3];

metadata.reduce(async (p, data, index) => {
  await p;

  console.log(index, data.title);

  const dist = `dist/${index.toString().padStart(4, '0')}-${data.title}`;

  await Promise.allSettled(
    [data.cover, ...data.screenshots]
      .filter((e) => !!e)
      .map(async (url, i) => {
        const filename = `screenshot-${i}.png`;
        try {
          fs.statSync(`${dist}/${filename}`);
        } catch {
          try {
            await download(url, dist, {
              filename,
              timeout: 2000,
            });
          } catch {}
        }
      }),
  );
  const rom = (roms as Record<string, string>)[data.title];
  if (rom && rom !== 'http://www.8bbit.com/roms-compressed/undefined.zip') {
    try {
      fs.statSync(`${dist}/rom.zip`);
    } catch {
      try {
        await download(rom, dist, {
          filename: `rom.zip`,
        });
      } catch (err) {
        console.log('zip fail:', data.title);
      }
    }
  }
}, Promise.resolve());

process.on('uncaughtException', () => {
  //
});
