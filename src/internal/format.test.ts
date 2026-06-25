import { describe, expect, it } from 'vitest';
import { formatFileSize } from './format.js';

describe('formatFileSize', () => {
  it('shows whole octets below a kilobyte', () => {
    expect(formatFileSize(0)).toBe('0 o');
    expect(formatFileSize(512)).toBe('512 o');
  });

  it('climbs the units at 1024', () => {
    expect(formatFileSize(1024)).toBe('1,0 Ko');
    expect(formatFileSize(1536)).toBe('1,5 Ko');
    expect(formatFileSize(1024 * 1024)).toBe('1,0 Mo');
    expect(formatFileSize(1024 ** 3)).toBe('1,0 Go');
  });

  it('uses a French decimal comma', () => {
    expect(formatFileSize(1468006)).toBe('1,4 Mo');
  });

  it('stops at the largest unit it knows', () => {
    expect(formatFileSize(1024 ** 6)).toContain('To');
  });

  it('returns nothing for a value that is not a size', () => {
    expect(formatFileSize(Number.NaN)).toBe('');
    expect(formatFileSize(-1)).toBe('');
  });
});
