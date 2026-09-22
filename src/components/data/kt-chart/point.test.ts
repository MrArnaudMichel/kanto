import { describe, expect, it } from 'vitest';
import {
  bubbleRadius,
  nearestPoint,
  pointLayout,
  pointPosition,
  type PointInput,
} from './point.js';

const input = (overrides: Partial<PointInput> = {}): PointInput => ({
  width: 400,
  height: 240,
  hidden: new Set(),
  bubble: false,
  min: null,
  max: null,
  noAxis: false,
  measure: (text) => text.length * 7,
  format: String,
  formatX: String,
  series: [
    {
      name: 'A',
      points: [
        { x: 1, y: 10 },
        { x: 5, y: 40 },
        { x: 9, y: 25 },
      ],
    },
  ],
  ...overrides,
});

describe('pointLayout', () => {
  it('scales both axes to the data, without forcing zero', () => {
    const layout = pointLayout(
      input({
        series: [
          {
            name: 'A',
            points: [
              { x: 50, y: 510 },
              { x: 60, y: 540 },
            ],
          },
        ],
      }),
    );
    expect(layout.x.min).toBeGreaterThan(0);
    expect(layout.y.min).toBeGreaterThan(0);
  });

  it('leaves hidden series out of both scales', () => {
    const series = [
      { name: 'A', points: [{ x: 1, y: 1 }] },
      { name: 'B', points: [{ x: 1000, y: 1000 }] },
    ];
    const layout = pointLayout(input({ series, hidden: new Set([1]) }));
    expect(layout.x.max).toBeLessThan(100);
    expect(layout.y.max).toBeLessThan(100);
  });

  it('puts a larger y higher and a larger x further right', () => {
    const layout = pointLayout(input());
    const [lowX, lowY] = pointPosition(layout, { x: 1, y: 10 });
    const [highX, highY] = pointPosition(layout, { x: 9, y: 40 });
    expect(highX).toBeGreaterThan(lowX);
    expect(highY).toBeLessThan(lowY);
  });
});

describe('bubbleRadius', () => {
  it('encodes the value as area, so four times the value is twice the radius', () => {
    expect(bubbleRadius(100, 100)).toBe(24);
    expect(bubbleRadius(25, 100)).toBe(12);
  });

  it('never shrinks a bubble out of sight', () => {
    expect(bubbleRadius(0, 100)).toBe(3);
    expect(bubbleRadius(undefined, 100)).toBe(3);
  });
});

describe('nearestPoint', () => {
  it('finds the point under the pointer', () => {
    const data = input();
    const layout = pointLayout(data);
    const [x, y] = pointPosition(layout, { x: 5, y: 40 });
    expect(nearestPoint(data, layout, x + 3, y - 2)).toEqual({ series: 0, index: 1 });
  });

  it('ignores a pointer nowhere near a point', () => {
    const data = input();
    const layout = pointLayout(data);
    const [x, y] = pointPosition(layout, { x: 5, y: 40 });
    expect(nearestPoint(data, layout, x + 60, y + 60)).toBeNull();
  });

  it('does not find points in a hidden series', () => {
    const data = input({ hidden: new Set([0]) });
    const layout = pointLayout(data);
    const [x, y] = pointPosition(layout, { x: 5, y: 40 });
    expect(nearestPoint(data, layout, x, y)).toBeNull();
  });
});
