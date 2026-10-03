import { describe, expect, it } from 'vitest';
import { durationOf, parseTime } from './motion.js';

describe('parseTime', () => {
  it('reads seconds and milliseconds', () => {
    expect(parseTime('0.2s')).toBe(200);
    expect(parseTime(' 160ms ')).toBe(160);
    expect(parseTime('.4s')).toBe(400);
  });

  it('is zero for nothing, zero or nonsense', () => {
    expect(parseTime('')).toBe(0);
    expect(parseTime('0s')).toBe(0);
    expect(parseTime('fast')).toBe(0);
  });
});

describe('durationOf', () => {
  it('reads a duration token where the element sits', () => {
    const el = document.createElement('div');
    el.style.setProperty('--duration-normal', '0.25s');
    document.body.append(el);
    expect(durationOf(el, '--duration-normal')).toBe(250);
    el.remove();
  });

  it('is zero when the token is not set — no theme, or reduced motion', () => {
    const el = document.createElement('div');
    document.body.append(el);
    expect(durationOf(el, '--duration-slow')).toBe(0);
    el.remove();
  });
});
