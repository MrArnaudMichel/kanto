import { describe, expect, it } from 'vitest';
import { rowWindow } from './window.js';

// 5,000 rows of 40px in a 400px viewport: ten rows fit.
const base = { rowCount: 5000, rowHeight: 40, viewportHeight: 400, overscan: 5 };

describe('rowWindow', () => {
  it('renders what fits at the top, plus the overscan below', () => {
    expect(rowWindow({ ...base, scrollTop: 0 })).toEqual({ start: 0, end: 15 });
  });

  it('renders the rows under the viewport, with the overscan on both sides', () => {
    expect(rowWindow({ ...base, scrollTop: 4000 })).toEqual({ start: 95, end: 115 });
  });

  it('counts a row cut by the top of the viewport as visible', () => {
    expect(rowWindow({ ...base, scrollTop: 4020 })).toEqual({ start: 95, end: 116 });
  });

  it('stops at the last row', () => {
    expect(rowWindow({ ...base, scrollTop: 199_600 })).toEqual({ start: 4985, end: 5000 });
    expect(rowWindow({ ...base, scrollTop: 900_000 })).toEqual({ start: 4985, end: 5000 });
  });

  it('renders a first batch before a row has been measured', () => {
    expect(rowWindow({ ...base, rowHeight: 0, scrollTop: 0 })).toEqual({ start: 0, end: 50 });
    expect(rowWindow({ ...base, rowCount: 12, rowHeight: 0, scrollTop: 0 })).toEqual({
      start: 0,
      end: 12,
    });
  });

  it('renders nothing for no rows', () => {
    expect(rowWindow({ ...base, rowCount: 0, scrollTop: 0 })).toEqual({ start: 0, end: 0 });
  });
});
