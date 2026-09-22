import { describe, expect, it } from 'vitest';
import { activeSection, railPosition, readingStops } from './progress.js';

describe('readingStops', () => {
  it('leaves sections that can reach the reading line where they are', () => {
    expect(readingStops([100, 300, 1300], 1500)).toEqual([100, 300, 1300]);
  });

  it('spreads the sections the page is too short to reach over the last stretch of scroll', () => {
    // 1600 and 1800 are beyond the furthest the page scrolls, so without this
    // they would both arrive at once, on the last pixel.
    expect(readingStops([100, 1600, 1800], 1500)).toEqual([100, 800, 1500]);
  });

  it('spreads from the top when not even the first section is reachable', () => {
    expect(readingStops([2000, 2100], 1000)).toEqual([500, 1000]);
  });
});

describe('activeSection', () => {
  const stops = readingStops([100, 1600, 1800], 1500);

  it('is none before the first section arrives', () => {
    expect(activeSection(50, stops)).toBe(-1);
  });

  it('is the last section to have arrived', () => {
    expect(activeSection(100, stops)).toBe(0);
    expect(activeSection(900, stops)).toBe(1);
  });

  it('reaches the last section at the bottom of a page too short for it', () => {
    expect(activeSection(1500, stops)).toBe(2);
  });
});

describe('railPosition', () => {
  // Sections arrive at scroll 100, 300 and 1300; their entries are centred at
  // 10, 30 and 50 on the rail.
  const stops = [100, 300, 1300];
  const centres = [10, 30, 50];

  it('sits on an entry exactly when its section arrives', () => {
    expect(railPosition(100, stops, centres)).toBe(10);
    expect(railPosition(300, stops, centres)).toBe(30);
    expect(railPosition(1300, stops, centres)).toBe(50);
  });

  it('slides between two entries at a steady rate, however long the section', () => {
    expect(railPosition(200, stops, centres)).toBe(20);
    expect(railPosition(800, stops, centres)).toBe(40);
  });

  it('rests on the first entry before anything arrives, and on the last after', () => {
    expect(railPosition(0, stops, centres)).toBe(10);
    expect(railPosition(5000, stops, centres)).toBe(50);
  });

  it('does not divide by zero when two sections arrive together', () => {
    expect(railPosition(300, [100, 300, 300], centres)).toBe(50);
  });
});
