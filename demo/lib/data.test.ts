import { describe, expect, it } from 'vitest';
import { buildEntities, serverPage, workEmail } from './data.js';

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

describe('serverPage', () => {
  const rows = buildEntities(240);

  it('returns the page asked for, and how many rows there are in all', () => {
    const { rows: page, total } = serverPage(rows, {
      page: 2,
      size: 10,
      sort: null,
      direction: null,
    });
    expect(total).toBe(240);
    expect(page.map((row) => row.id)).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
  });

  it('sorts the whole set before cutting the page, as a database would', () => {
    const { rows: first } = serverPage(rows, {
      page: 1,
      size: 5,
      sort: 'amount',
      direction: 'desc',
    });
    const highest = Math.max(...rows.map((row) => row.amount));
    expect(first[0]!.amount).toBe(highest);
    expect(first.map((row) => row.amount)).toEqual(
      [...first.map((row) => row.amount)].sort((a, b) => b - a),
    );
  });

  it('returns an empty page past the end', () => {
    expect(serverPage(rows, { page: 99, size: 10, sort: null, direction: null }).rows).toEqual([]);
  });
});
