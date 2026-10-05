import { fileURLToPath } from 'node:url';
import { bundle } from '../lib/bundle.js';

const from = fileURLToPath(new URL('../../../templates', import.meta.url));
const to = fileURLToPath(new URL('../templates', import.meta.url));
console.log(`create-kanto: bundled ${bundle(from, to).join(', ')}`);
