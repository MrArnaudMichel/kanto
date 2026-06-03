/**
 * Copies the non-compiled assets (CSS token layer, webfonts) into dist/,
 * preserving the source layout so the relative url() references in
 * tokens/fonts.css keep resolving.
 */
import { cp, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const copies = [
  ['src/styles.css', 'dist/styles.css'],
  ['src/tokens', 'dist/tokens'],
  ['src/assets', 'dist/assets'],
];

for (const [from, to] of copies) {
  await mkdir(dirname(join(root, to)), { recursive: true });
  await cp(join(root, from), join(root, to), { recursive: true });
  console.log(`copied ${from} -> ${to}`);
}
