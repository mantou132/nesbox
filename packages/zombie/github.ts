import 'dotenv/config';
import { writeFile } from 'fs/promises';
import { resolve } from 'path';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';

import { Octokit } from '@octokit/core';

import originMetadata1 from './metadata1.json';
import originMetadata2 from './metadata2.json';
import originMetadata3 from './metadata3.json';
import issues from './github.json';

import { Data } from 'index';

const roms = JSON.parse(readFileSync('./roms.json', { encoding: 'utf-8' }));

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function wrieteIssue({ cover, description, screenshots, title }: Data) {
  const {
    data: { number },
  } = await octokit.request('POST /repos/{owner}/{repo}/issues', {
    owner: 'mantou132',
    repo: 'nesbox',
    title,
    body: `
![](${cover})

${description}

${screenshots.map((s, index) => `![screenshot ${index + 1}](${s})`).join('\n')}

[rom](${(roms as Record<string, string>)[title]})
`,
    labels: ['game'],
    assignees: ['mantou132'],
  });

  await writeFile(resolve(__dirname, 'github.json'), JSON.stringify({ ...issues, [title]: number }, null, 2));

  execSync(`open https://github.com/mantou132/nesbox/issues/${number}`);
}

const first = [...originMetadata1, ...originMetadata2, ...originMetadata3].find(
  (e) => !(issues as Record<string, number>)[(e as Data).title],
);
if (first) wrieteIssue(first);
