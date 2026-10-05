import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

rmSync(fileURLToPath(new URL('../templates', import.meta.url)), { recursive: true, force: true });
