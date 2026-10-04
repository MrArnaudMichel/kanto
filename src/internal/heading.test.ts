import { render } from 'lit';
import { describe, expect, it } from 'vitest';
import { heading } from './heading.js';

const draw = (level: number, fallback?: number) => {
  const host = document.createElement('div');
  render(heading(level, 'Title', 'title', fallback), host);
  return host.firstElementChild!;
};

describe('heading', () => {
  it('draws the level asked for, with its class', () => {
    expect(draw(3).localName).toBe('h3');
    expect(draw(1).className).toBe('title');
  });

  it('keeps the level between 1 and 6', () => {
    expect(draw(0).localName).toBe('h1');
    expect(draw(9).localName).toBe('h6');
  });

  it('falls back when the level is not a number', () => {
    expect(draw(Number.NaN).localName).toBe('h2');
    expect(draw(Number.NaN, 1).localName).toBe('h1');
  });
});
