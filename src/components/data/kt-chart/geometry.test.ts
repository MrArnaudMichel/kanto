import { describe, expect, it } from 'vitest';
import {
  TAU,
  arcPath,
  barPath,
  linearPath,
  monotonePath,
  monotoneSegments,
  polar,
  type Segment,
} from './geometry.js';

/** A point on a cubic Bézier segment. */
function bezier(segment: Segment, t: number): readonly [number, number] {
  const u = 1 - t;
  const at = (axis: 0 | 1) =>
    u ** 3 * segment.from[axis] +
    3 * u * u * t * segment.c1[axis] +
    3 * u * t * t * segment.c2[axis] +
    t ** 3 * segment.to[axis];
  return [at(0), at(1)];
}

describe('monotoneSegments', () => {
  it('never draws a value outside the two samples it joins', () => {
    const points = [
      [0, 10],
      [10, 80],
      [20, 78],
      [30, 5],
      [40, 60],
    ] as const;

    for (const segment of monotoneSegments(points)) {
      const lo = Math.min(segment.from[1], segment.to[1]);
      const hi = Math.max(segment.from[1], segment.to[1]);
      for (let t = 0; t <= 1; t += 0.05) {
        const [, y] = bezier(segment, t);
        expect(y).toBeGreaterThanOrEqual(lo - 1e-9);
        expect(y).toBeLessThanOrEqual(hi + 1e-9);
      }
    }
  });

  it('keeps a flat run flat', () => {
    const [flat] = monotoneSegments([
      [0, 5],
      [10, 5],
      [20, 9],
    ]);
    expect([flat!.c1[1], flat!.c2[1]]).toEqual([5, 5]);
  });
});

describe('paths', () => {
  it('draws straight segments for a linear path and curves for a monotone one', () => {
    const points = [
      [0, 0],
      [10, 10],
      [20, 5],
    ] as const;
    expect(linearPath(points)).toBe('M0,0 L10,10 L20,5');
    expect(monotonePath(points)).toMatch(/^M0,0 C/);
  });

  it('falls back to a straight line between two points', () => {
    expect(
      monotonePath([
        [0, 0],
        [10, 10],
      ]),
    ).toBe('M0,0 L10,10');
  });

  it('continues an existing path when asked not to move', () => {
    expect(linearPath([[5, 5]], false)).toBe('L5,5');
  });
});

describe('polar', () => {
  it('measures angles clockwise from twelve o’clock', () => {
    expect(polar(0, 0, 10, 0)).toEqual([0, -10]);
    const [x, y] = polar(0, 0, 10, TAU / 4);
    expect(x).toBeCloseTo(10);
    expect(y).toBeCloseTo(0);
  });
});

describe('arcPath', () => {
  it('draws a wedge to the centre when there is no hole', () => {
    expect(arcPath(50, 50, 0, 40, 0, TAU / 4)).toBe('M50,50 L50,10 A40,40 0 0 1 90,50 Z');
  });

  it('draws a full ring as two circles, so a single 100% slice has no seam', () => {
    const d = arcPath(50, 50, 20, 40, 0, TAU);
    expect(d.match(/A40,40/g)).toHaveLength(2);
    expect(d.match(/A20,20/g)).toHaveLength(2);
  });

  it('uses the large-arc flag past half a turn', () => {
    expect(arcPath(0, 0, 0, 10, 0, TAU * 0.75)).toContain(' 0 1 1 ');
  });

  it('draws nothing for an empty slice', () => {
    expect(arcPath(0, 0, 0, 10, 1, 1)).toBe('');
  });
});

describe('barPath', () => {
  it('rounds only the tip, leaving the baseline square', () => {
    const d = barPath(0, 0, 20, 100, 4, 'top');
    expect(d.startsWith('M0,100')).toBe(true);
    expect(d.match(/A4,4/g)).toHaveLength(2);
    expect(d).toContain('20,100');
  });

  it('clamps the radius to half the width', () => {
    expect(barPath(0, 0, 4, 30, 4, 'top')).toContain('A2,2');
  });

  it('clamps the radius to the length of a short bar', () => {
    expect(barPath(0, 0, 20, 1, 4, 'top')).toContain('A1,1');
  });

  it('is a plain rectangle with no tip', () => {
    expect(barPath(0, 0, 10, 10, 4, 'none')).not.toContain('A');
  });
});
