/** At pack time: the library at this commit, as data.json beside the server. */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { collect } from './collect.js';

const data = await collect(fileURLToPath(new URL('../../..', import.meta.url)));
writeFileSync(new URL('../data.json', import.meta.url), JSON.stringify(data));
console.log(
  `kanto-mcp: bundled ${data.components.length} components and ${data.guides.length} guides, at ${data.version}`,
);
