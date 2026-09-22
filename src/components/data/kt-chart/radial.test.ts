import { describe, expect, it } from 'vitest';
import { TAU } from './geometry.js';
import { radialLayout, sliceAt, type RadialInput } from './radial.js';

const input = (overrides: Partial<RadialInput> = {}): RadialInput => ({
  width: 300,
  height: 240,
  kind: 'pie',
  hidden: new Set(),
  measure: (text) => text.length * 7,
  labels: ['Direct', 'Search', 'Social', 'Refund'],
  series: [{ name: 'Visits', values: [50, 30, 20, -10] }],
  ...overrides,
});

const span = (slice: { start: number; end: number }) => slice.end - slice.start;

describe('radialLayout', () => {
  it('shares a full turn in proportion to the values', () => {
    const { slices } = radialLayout(input());
    expect(span(slices[0]!)).toBeCloseTo(TAU * 0.5);
    expect(slices.at(-1)!.end).toBeCloseTo(TAU);
  });

  it('draws a negative slice as nothing', () => {
    expect(span(radialLayout(input()).slices[3]!)).toBe(0);
  });

  it('re-shares the turn when a slice is hidden', () => {
    const { slices } = radialLayout(input({ hidden: new Set([0]) }));
    expect(span(slices[0]!)).toBe(0);
    expect(span(slices[1]!)).toBeCloseTo(TAU * 0.6);
  });

  it('totals only what is shown', () => {
    expect(radialLayout(input({ hidden: new Set([0]) })).total).toBe(50);
  });

  it('opens a hole for a doughnut and none for a pie', () => {
    expect(radialLayout(input()).inner).toBe(0);
    const doughnut = radialLayout(input({ kind: 'doughnut' }));
    expect(doughnut.inner / doughnut.outer).toBeCloseTo(0.62);
  });

  it('gives polar slices equal angles and area in proportion to value', () => {
    const { slices } = radialLayout(
      input({ kind: 'polar-area', series: [{ name: 'V', values: [100, 25, 25, 25] }] }),
    );
    expect(span(slices[0]!)).toBeCloseTo(span(slices[1]!));
    expect(slices[0]!.outer / slices[1]!.outer).toBeCloseTo(2);
  });

  it('puts one spoke per label on a radar, evenly spread', () => {
    const { slices } = radialLayout(
      input({ kind: 'radar', series: [{ name: 'A', values: [1, 2, 3, 4] }] }),
    );
    expect(slices.map((slice) => slice.start)).toEqual([0, TAU / 4, TAU / 2, (3 * TAU) / 4]);
  });

  it('leaves room around a radar for its labels', () => {
    const pie = radialLayout(input());
    const radar = radialLayout(
      input({ kind: 'radar', series: [{ name: 'A', values: [1, 2, 3, 4] }] }),
    );
    expect(radar.outer).toBeLessThan(pie.outer);
  });
});

describe('sliceAt', () => {
  it('finds the slice under the pointer, and nothing outside the pie', () => {
    const layout = radialLayout(input());
    expect(sliceAt(layout, 'pie', layout.cx + 5, layout.cy - layout.outer / 2)).toBe(0);
    expect(sliceAt(layout, 'pie', 0, 0)).toBe(-1);
  });

  it('ignores the hole of a doughnut', () => {
    const layout = radialLayout(input({ kind: 'doughnut' }));
    expect(sliceAt(layout, 'doughnut', layout.cx, layout.cy)).toBe(-1);
  });

  it('snaps to the nearest spoke on a radar', () => {
    const layout = radialLayout(
      input({ kind: 'radar', series: [{ name: 'A', values: [1, 2, 3, 4] }] }),
    );
    // Just short of three o'clock: the second spoke.
    expect(sliceAt(layout, 'radar', layout.cx + layout.outer / 2, layout.cy - 4)).toBe(1);
  });
});
