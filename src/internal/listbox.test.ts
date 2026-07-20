import { describe, expect, it } from 'vitest';
import {
  filterOptions,
  firstEnabledIndex,
  lastEnabledIndex,
  nextEnabledIndex,
  optionLabel,
  type KtOption,
} from './listbox.js';

const options: KtOption[] = [
  { id: 'fr', label: 'France' },
  { id: 'be', label: 'Belgium', disabled: true },
  { id: 'ch', label: 'Switzerland' },
  { id: 42 },
];

describe('optionLabel', () => {
  it('prefers the label and falls back to the id', () => {
    expect(optionLabel({ id: 'fr', label: 'France' })).toBe('France');
    expect(optionLabel({ id: 42 })).toBe('42');
  });
});

describe('filterOptions', () => {
  it('returns everything for a blank query', () => {
    expect(filterOptions(options, '   ')).toHaveLength(4);
  });

  it('matches the visible label, ignoring case', () => {
    expect(filterOptions(options, 'SWITZ').map((o) => o.id)).toEqual(['ch']);
  });

  it('matches an option that only has an id', () => {
    expect(filterOptions(options, '42').map((o) => o.id)).toEqual([42]);
  });
});

describe('nextEnabledIndex', () => {
  it('skips disabled options going forwards', () => {
    expect(nextEnabledIndex(options, 0, 1)).toBe(2);
  });

  it('skips disabled options going backwards', () => {
    expect(nextEnabledIndex(options, 2, -1)).toBe(0);
  });

  it('wraps at both ends', () => {
    expect(nextEnabledIndex(options, 3, 1)).toBe(0);
    expect(nextEnabledIndex(options, 0, -1)).toBe(3);
  });

  it('returns -1 when nothing can be selected', () => {
    expect(nextEnabledIndex([{ id: 'a', disabled: true }], 0, 1)).toBe(-1);
    expect(nextEnabledIndex([], 0, 1)).toBe(-1);
  });
});

describe('firstEnabledIndex / lastEnabledIndex', () => {
  it('finds the ends, skipping disabled entries', () => {
    const edged: KtOption[] = [
      { id: 'a', disabled: true },
      { id: 'b' },
      { id: 'c', disabled: true },
    ];
    expect(firstEnabledIndex(edged)).toBe(1);
    expect(lastEnabledIndex(edged)).toBe(1);
  });

  it('returns -1 for an empty list', () => {
    expect(firstEnabledIndex([])).toBe(-1);
    expect(lastEnabledIndex([])).toBe(-1);
  });
});
