import fs from 'node:fs/promises';
import path from 'node:path';

import pkg from '../packages/nes-pkg/package.json' assert { type: 'json' };

const pathname = path.resolve(process.cwd(), 'packages/nes-pkg', pkg.module);
const content = await fs.readFile(pathname, {
  encoding: 'utf8',
});

await fs.writeFile(
  pathname,
  content.replace(/new Function\(.*\)/g, 'new Function("console.warn(`new Function be replaced`)")'),
);
