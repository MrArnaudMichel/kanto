import { describe, expect, it } from 'vitest';
import { formatFileSize } from './format.js';

describe('formatFileSize', () => {
  it('shows whole bytes below a kilobyte', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(512)).toBe('512 B');
  });

  it('climbs the units at 1024', () => {
    expect(formatFileSize(1024)).toBe('1.0 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
    expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
    expect(formatFileSize(1024 ** 3)).toBe('1.0 GB');
  });

  it('keeps one decimal above a kilobyte', () => {
    expect(formatFileSize(1468006)).toBe('1.4 MB');
  });

  it('stops at the largest unit it knows', () => {
    expect(formatFileSize(1024 ** 6)).toContain('TB');
  });

  it('returns nothing for a value that is not a size', () => {
    expect(formatFileSize(Number.NaN)).toBe('');
    expect(formatFileSize(-1)).toBe('');
  });
});
