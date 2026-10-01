import { describe, expect, it } from 'vitest';
import { padSegment, stepSegment, typeDigit, type SegmentSpec } from './segments.js';

const day: SegmentSpec = { min: 1, max: 31, length: 2 };
const month: SegmentSpec = { min: 1, max: 12, length: 2 };
const year: SegmentSpec = { min: 1, max: 9999, length: 4 };
const minute: SegmentSpec = { min: 0, max: 59, length: 2 };

describe('typeDigit', () => {
  it('fills a segment digit by digit, moving on once it is full', () => {
    expect(typeDigit('', '2', day)).toEqual({ text: '2', advance: false });
    expect(typeDigit('2', '5', day)).toEqual({ text: '25', advance: true });
  });

  it('moves on at once when no second digit could follow', () => {
    // A day starting with 4 can only be the 4th; a month starting with 2, February.
    expect(typeDigit('', '4', day)).toEqual({ text: '4', advance: true });
    expect(typeDigit('', '2', month)).toEqual({ text: '2', advance: true });
    expect(typeDigit('', '1', month)).toEqual({ text: '1', advance: false });
  });

  it('starts over when the next digit would overshoot the maximum', () => {
    expect(typeDigit('3', '5', day)).toEqual({ text: '5', advance: true });
    expect(typeDigit('1', '3', month)).toEqual({ text: '3', advance: true });
  });

  it('starts over in a segment already full', () => {
    expect(typeDigit('25', '1', day)).toEqual({ text: '1', advance: false });
  });

  it('waits for a year to have all its digits', () => {
    expect(typeDigit('202', '6', year)).toEqual({ text: '2026', advance: true });
    expect(typeDigit('9', '8', year)).toEqual({ text: '98', advance: false });
  });

  it('takes a leading zero, which only a second digit can complete', () => {
    expect(typeDigit('', '0', minute)).toEqual({ text: '0', advance: false });
    expect(typeDigit('0', '5', minute)).toEqual({ text: '05', advance: true });
  });
});

describe('stepSegment', () => {
  it('steps within the bounds and wraps around them', () => {
    expect(stepSegment(5, 1, month)).toBe(6);
    expect(stepSegment(12, 1, month)).toBe(1);
    expect(stepSegment(1, -1, month)).toBe(12);
  });

  it('starts an empty segment from its first value going up, its last going down', () => {
    expect(stepSegment(null, 1, day)).toBe(1);
    expect(stepSegment(null, -1, day)).toBe(31);
  });

  it('moves by a step, landing on its multiples', () => {
    expect(stepSegment(7, 15, minute)).toBe(15);
    expect(stepSegment(7, -15, minute)).toBe(0);
    expect(stepSegment(45, 15, minute)).toBe(0);
    expect(stepSegment(0, -15, minute)).toBe(45);
  });
});

describe('padSegment', () => {
  it('writes a value with its leading zeros', () => {
    expect(padSegment(4, day)).toBe('04');
    expect(padSegment(98, year)).toBe('0098');
  });
});
