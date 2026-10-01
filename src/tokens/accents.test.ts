import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { accentsCss } from '../../scripts/generate-accents.js';
import { KT_ACCENTS } from '../theme/accent.js';

const file = readFileSync(join(process.cwd(), 'src/tokens/accents.css'), 'utf8');

describe('accents.css', () => {
  it('is what the generator writes — run node scripts/generate-accents.js', () => {
    expect(file).toBe(accentsCss());
  });

  it('has a block for every preset', () => {
    for (const { id } of KT_ACCENTS) expect(file).toContain(`[data-accent='${id}']`);
  });

  it('gives violet the literal default, so it resets a nested accent', () => {
    expect(file).toMatch(/\[data-accent='violet'\] \{\n {2}--accent-base: #5f5dea;/);
  });
});
