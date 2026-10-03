import { describe, expect, it } from 'vitest';
import { PLANE, circle, mix, pathOf, resample } from './morph.js';

const distance = (a: readonly number[], b: readonly number[]) =>
  Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!);

describe('morph geometry', () => {
  it('resamples a closed outline into evenly spaced points', () => {
    const square = resample(
      [
        [0, 0],
        [4, 0],
        [4, 4],
        [0, 4],
      ],
      8,
    );
    expect(square).toHaveLength(8);
    for (let i = 0; i < 8; i += 1) {
      expect(distance(square[i]!, square[(i + 1) % 8]!)).toBeCloseTo(2, 5);
    }
    expect(square[0]).toEqual([0, 0]);
  });

  it('draws the plane as its outline, starting at its tail', () => {
    const plane = resample(PLANE, 64);
    expect(plane).toHaveLength(64);
    expect(plane[0]).toEqual(PLANE[0]);
  });

  it('draws a circle of radius 9 round the centre, starting where asked', () => {
    const ring = circle(64, -Math.PI / 2);
    expect(ring).toHaveLength(64);
    for (const point of ring) expect(distance(point, [12, 12])).toBeCloseTo(9, 5);
    expect(ring[0]![0]).toBeCloseTo(12, 5);
    expect(ring[0]![1]).toBeCloseTo(3, 5);
  });

  it('mixes two shapes point by point', () => {
    const a = [
      [0, 0],
      [2, 2],
    ] as const;
    const b = [
      [4, 0],
      [2, 6],
    ] as const;
    expect(mix(a, b, 0)).toEqual(a);
    expect(mix(a, b, 1)).toEqual(b);
    expect(mix(a, b, 0.5)).toEqual([
      [2, 0],
      [2, 4],
    ]);
  });

  it('writes points as one closed path', () => {
    expect(
      pathOf([
        [1, 2],
        [3, 4.5],
      ]),
    ).toBe('M1 2L3 4.5Z');
  });
});
