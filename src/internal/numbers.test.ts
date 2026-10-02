import { describe, expect, it } from 'vitest';
import { decimalsOf } from './numbers.js';

describe('decimalsOf', () => {
  it('counts the decimals a number is written with', () => {
    expect(decimalsOf(1)).toBe(0);
    expect(decimalsOf(0.25)).toBe(2);
    expect(decimalsOf(1.5)).toBe(1);
    expect(decimalsOf(1e-7)).toBe(7);
    expect(decimalsOf(1200)).toBe(0);
    expect(decimalsOf(Number.NEGATIVE_INFINITY)).toBe(0);
  });
});
