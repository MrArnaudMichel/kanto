import { describe, expect, it } from 'vitest';
import { niceTicks, project, tickCount, ticksFor, valueBounds } from './scale.js';

describe('niceTicks', () => {
  it('lands on round steps that cover the data', () => {
    expect(niceTicks(0, 71, 5).values).toEqual([0, 20, 40, 60, 80]);
  });

  it('handles small fractions without floating-point noise', () => {
    expect(niceTicks(0, 0.034, 5).values).toEqual([0, 0.01, 0.02, 0.03, 0.04]);
  });

  it('spans zero for a range that crosses it', () => {
    expect(niceTicks(-12, 30, 5).values).toEqual([-20, -10, 0, 10, 20, 30]);
  });

  it('keeps large ranges to a handful of ticks', () => {
    expect(niceTicks(0, 1_234_567, 5).values).toEqual([0, 500_000, 1_000_000, 1_500_000]);
  });

  it('does not run the axis far past the data', () => {
    // 610 used to produce an axis to 1000, leaving the top half of the plot empty.
    expect(niceTicks(0, 610, 4).max).toBeLessThanOrEqual(800);
    expect(niceTicks(0, 11.8, 3).max).toBeLessThanOrEqual(15);
  });

  it('opens a flat range instead of dividing by zero', () => {
    const ticks = niceTicks(5, 5, 5);
    expect(ticks.min).toBeLessThanOrEqual(5);
    expect(ticks.max).toBeGreaterThan(5);
  });

  it('never writes negative zero', () => {
    expect(niceTicks(-0.5, 0, 3).values.some((value) => Object.is(value, -0))).toBe(false);
  });
});

describe('valueBounds', () => {
  it('sums a stack separately above and below zero', () => {
    // Three series stacked across two indices; the negatives pile downwards.
    const stack = [
      [10, 20],
      [-5, -10],
      [-3, -2],
    ];
    expect(valueBounds([stack], [], { includeZero: true })).toEqual({ lo: -12, hi: 20 });
  });

  it('adds up the positive parts of a stack', () => {
    const stack = [
      [30, 30],
      [40, 50],
    ];
    expect(valueBounds([stack], [], { includeZero: true })).toEqual({ lo: 0, hi: 80 });
  });

  it('lets a line float away from zero', () => {
    expect(valueBounds([], [[40, 55, 48]], { includeZero: false })).toEqual({ lo: 40, hi: 55 });
  });

  it('pulls zero in for bars and areas', () => {
    expect(valueBounds([], [[40, 55]], { includeZero: true })).toEqual({ lo: 0, hi: 55 });
  });

  it('is a unit range when there is nothing to show', () => {
    expect(valueBounds([], [], { includeZero: true })).toEqual({ lo: 0, hi: 1 });
  });
});

describe('ticksFor', () => {
  it('honours an explicit min and max exactly', () => {
    const ticks = ticksFor(12, 87, 5, { min: 0, max: 100 });
    expect([ticks.min, ticks.max]).toEqual([0, 100]);
    expect(ticks.values.every((value) => value >= 0 && value <= 100)).toBe(true);
  });

  it('falls back to the nice range when no limits are given', () => {
    expect(ticksFor(0, 71, 5, { min: null, max: null }).max).toBe(80);
  });
});

describe('project', () => {
  it('maps the tick range onto pixels, either direction', () => {
    const ticks = niceTicks(0, 100, 5);
    expect(project(50, ticks, 0, 200)).toBe(100);
    expect(project(100, ticks, 200, 0)).toBe(0);
  });
});

describe('tickCount', () => {
  it('stays between three and six', () => {
    expect(tickCount(40, 48)).toBe(3);
    expect(tickCount(1000, 48)).toBe(6);
    expect(tickCount(200, 48)).toBe(4);
  });
});
