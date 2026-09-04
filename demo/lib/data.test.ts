import { describe, expect, it } from 'vitest';
import { buildEntities, workEmail } from './data.js';

describe('workEmail', () => {
  it('collapses a run of punctuation into one dot', () => {
    // The bug this replaced: `[^a-z] -> .` made the full stop and the space
    // after it two separate dots.
    expect(workEmail('F. Nguyen')).toBe('f.nguyen@kanto.studio');
    expect(workEmail("Siobhán O'Connor-Hughes")).toBe('siobh.n.o.connor.hughes@kanto.studio');
  });

  it('never leaves a dot against the @ or at the front', () => {
    for (const name of ['. Ada', 'Ada .', '...', 'Ada Lovelace']) {
      const local = workEmail(name).split('@')[0]!;
      expect(local.startsWith('.'), name).toBe(false);
      expect(local.endsWith('.'), name).toBe(false);
    }
  });

  it('takes the domain', () => {
    expect(workEmail('Ada Lovelace', 'example.com')).toBe('ada.lovelace@example.com');
  });

  it('keeps distinct people distinct', () => {
    // The sample generator reuses a small cast, so compare the names it
    // actually produced rather than the row count.
    const names = [...new Set(buildEntities(40, 8080).map((row) => String(row.owner)))];
    expect(names.length).toBeGreaterThan(1);
    expect(new Set(names.map((name) => workEmail(name))).size).toBe(names.length);
  });
});
