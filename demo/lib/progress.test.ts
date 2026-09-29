import { describe, expect, it } from 'vitest';
import { railOffset, visibleSections, visibleSpan } from './progress.js';

// Three sections: 100–300, 300–1300 and 1300 to the end of the page at 1500,
// each with a 20px entry on the rail.
const sections = [100, 300, 1300];
const end = 1500;
const entries = [
  { top: 0, height: 20 },
  { top: 20, height: 20 },
  { top: 40, height: 20 },
];

describe('railOffset', () => {
  it('maps the start of each section to the top of its entry', () => {
    expect(railOffset(100, sections, end, entries)).toBe(0);
    expect(railOffset(300, sections, end, entries)).toBe(20);
    expect(railOffset(1300, sections, end, entries)).toBe(40);
  });

  it('moves through an entry at the rate its section is read, however long it is', () => {
    expect(railOffset(200, sections, end, entries)).toBe(10);
    expect(railOffset(800, sections, end, entries)).toBe(30);
  });

  it('stays at the first entry above the first section, and ends at the last', () => {
    expect(railOffset(0, sections, end, entries)).toBe(0);
    expect(railOffset(1500, sections, end, entries)).toBe(60);
    expect(railOffset(9000, sections, end, entries)).toBe(60);
  });

  it('does not divide by zero for a section with no length', () => {
    expect(railOffset(300, [100, 300, 300], end, entries)).toBe(40);
  });
});

describe('visibleSpan', () => {
  it('covers the part of the rail whose sections are on screen', () => {
    expect(visibleSpan(200, 800, sections, end, entries)).toEqual({ top: 10, size: 20 });
  });

  it('covers every entry when the whole page fits on screen', () => {
    expect(visibleSpan(0, 1500, sections, end, entries)).toEqual({ top: 0, size: 60 });
  });
});

describe('visibleSections', () => {
  it('lists every section with some of it on screen', () => {
    expect(visibleSections(200, 1400, sections, end)).toEqual([0, 1, 2]);
    expect(visibleSections(400, 900, sections, end)).toEqual([1]);
  });

  it('leaves out a section that ends exactly where the screen starts', () => {
    expect(visibleSections(300, 800, sections, end)).toEqual([1]);
  });

  it('is empty above the first section', () => {
    expect(visibleSections(0, 50, sections, end)).toEqual([]);
  });
});
