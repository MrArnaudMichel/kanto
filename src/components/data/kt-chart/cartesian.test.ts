import { describe, expect, it } from 'vitest';
import {
  cartesianLayout,
  categoryAt,
  categoryCentre,
  valuePosition,
  type CartesianInput,
} from './cartesian.js';

const input = (overrides: Partial<CartesianInput> = {}): CartesianInput => ({
  width: 480,
  height: 200,
  labels: ['A', 'B', 'C', 'D'],
  series: [{ name: 'S', values: [10, 30, 20, 40] }],
  hidden: new Set(),
  type: 'line',
  stacked: false,
  horizontal: false,
  min: null,
  max: null,
  noAxis: false,
  measure: (text) => text.length * 7,
  format: String,
  ...overrides,
});

describe('cartesianLayout', () => {
  it('makes room on the left for the widest value label', () => {
    const narrow = cartesianLayout(input());
    const wide = cartesianLayout(input({ format: (n) => `$${n.toLocaleString('en-US')}.00` }));
    expect(wide.box.x).toBeGreaterThan(narrow.box.x + 20);
  });

  it('gives the value axis no room when it is hidden', () => {
    expect(cartesianLayout(input({ noAxis: true })).box.x).toBeLessThan(10);
  });

  it('spreads a line edge to edge and centres bars in their bands', () => {
    const line = cartesianLayout(input());
    expect(categoryCentre(line, 0)).toBe(line.box.x);
    expect(categoryCentre(line, 3)).toBe(line.box.x + line.box.width);

    const bars = cartesianLayout(input({ type: 'bar' }));
    const band = bars.box.width / 4;
    expect(categoryCentre(bars, 0)).toBeCloseTo(bars.box.x + band / 2);
  });

  it('starts bars at zero but lets a line follow its data', () => {
    const series = [{ name: 'S', values: [40, 55, 48, 52] }];
    expect(cartesianLayout(input({ series })).ticks.min).toBeGreaterThan(0);
    expect(cartesianLayout(input({ series, type: 'bar' })).ticks.min).toBe(0);
  });

  it('sizes a stack by its total', () => {
    const series = [
      { name: 'A', values: [30, 30] },
      { name: 'B', values: [40, 50] },
    ];
    const layout = cartesianLayout(
      input({ series, type: 'bar', stacked: true, labels: ['x', 'y'] }),
    );
    expect(layout.ticks.max).toBeGreaterThanOrEqual(80);
  });

  it('leaves hidden series out of the scale', () => {
    const series = [
      { name: 'A', values: [10, 10] },
      { name: 'B', values: [900, 900] },
    ];
    const layout = cartesianLayout(input({ series, hidden: new Set([1]), labels: ['x', 'y'] }));
    expect(layout.ticks.max).toBeLessThan(100);
    expect(layout.visible).toEqual([0]);
  });

  it('honours a series drawn as another mark', () => {
    const series = [
      { name: 'A', values: [1, 2] },
      { name: 'B', values: [2, 3], type: 'line' as const },
    ];
    const layout = cartesianLayout(input({ series, type: 'bar', labels: ['x', 'y'] }));
    expect(layout.marks).toEqual(['bar', 'line']);
    expect(layout.banded).toBe(true);
  });

  it('only lays bars out sideways when every visible mark is a bar', () => {
    expect(cartesianLayout(input({ type: 'bar', horizontal: true })).horizontal).toBe(true);
    expect(cartesianLayout(input({ type: 'line', horizontal: true })).horizontal).toBe(false);
  });

  it('counts categories from the longest of the labels and the series', () => {
    expect(cartesianLayout(input({ labels: [] })).count).toBe(4);
  });
});

describe('positions and hit testing', () => {
  it('maps a pointer to the band it is over', () => {
    const layout = cartesianLayout(input({ type: 'bar' }));
    const x = layout.box.x + layout.box.width * 0.6;
    expect(categoryAt(layout, x, layout.box.y)).toBe(2);
  });

  it('snaps a pointer to the nearest sample on a line, clamped to the ends', () => {
    const layout = cartesianLayout(input());
    expect(categoryAt(layout, layout.box.x + layout.box.width + 50, 0)).toBe(3);
    expect(categoryAt(layout, -50, 0)).toBe(0);
  });

  it('reads the pointer vertically for horizontal bars', () => {
    const layout = cartesianLayout(input({ type: 'bar', horizontal: true }));
    expect(categoryAt(layout, 0, layout.box.y + layout.box.height * 0.1)).toBe(0);
    expect(categoryAt(layout, 0, layout.box.y + layout.box.height * 0.9)).toBe(3);
  });

  it('puts larger values higher when vertical and further right when horizontal', () => {
    const vertical = cartesianLayout(input({ type: 'bar' }));
    expect(valuePosition(vertical, 40)).toBeLessThan(valuePosition(vertical, 10));

    const horizontal = cartesianLayout(input({ type: 'bar', horizontal: true }));
    expect(valuePosition(horizontal, 40)).toBeGreaterThan(valuePosition(horizontal, 10));
  });
});
