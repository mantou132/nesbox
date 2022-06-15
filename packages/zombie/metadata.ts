import fs from 'fs';

const metadata1 = require('./metadata1.json');
const metadata2 = require('./metadata2.json');
const metadata3 = require('./metadata3.json');

const metadata = [...metadata1, ...metadata2, ...metadata3];

fs.writeFileSync(
  'matedata.json',
  JSON.stringify(
    metadata.map((e) => ({ title: e.title, description: e.description })),
    null,
    2,
  ),
);
