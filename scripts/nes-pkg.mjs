#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';

import pkg from '../packages/nes-pkg/package.json' assert { type: 'json' };

const old = ['__wbg_log_ffb63dcc9cf67297'];

function executeShellCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    exec(
      command,
      {
        cwd,
        env: {
          PATH: process.env.PATH,
        },
      },
      (error, stdout) => {
        if (error) {
          reject(error);
          return;
        }
        process.stdout.write(stdout);
        resolve(stdout);
      },
    );
  });
}

// 用 debug 模式生成包含 nesbox_bevy app 相关的代码，这让 js 胶水代码同时兼容 nes 模拟器和 nesbox_bevy app.
await executeShellCommand('yarn build:nes --debug');

const pathname = path.resolve(process.cwd(), 'packages/nes-pkg', pkg.module);

const content = (
  await fs.readFile(pathname, {
    encoding: 'utf8',
  })
)
  .replace(/new Function\(.*\)/g, 'new Function("console.warn(`new Function be replaced`)")')
  .replace('return imports;', (matchStr, i, scriptContent) => {
    const f = old
      .map((name) => {
        const n = name.match(/(.*_)[0-9a-z]{16}/)[1];
        const newName = scriptContent.match(new RegExp(`${n}[0-9a-z]{16}`))[0];
        return `imports.wbg.${name} = imports.wbg.${newName}`;
      })
      .join(';');
    return `${f};${matchStr}`;
  });

await executeShellCommand('yarn build:nes');

await fs.writeFile(pathname, content);

if (!process.argv.includes('--test')) {
  await executeShellCommand('npm publish --access=public', path.resolve(process.cwd(), 'packages/nes-pkg'));
}
