import { describe, expect, it } from 'vitest';
import { placeFloating } from './position.js';

const viewport = { width: 800, height: 600 };
const bubble = { width: 80, height: 24 };
const anchor = (left: number, top: number) => ({ left, top, width: 20, height: 20 });

describe('placeFloating', () => {
  it('centres the box on the side asked for when it fits', () => {
    expect(placeFloating(anchor(100, 100), bubble, viewport, 'top')).toEqual({
      x: 70,
      y: 70,
      placement: 'top',
    });
    expect(placeFloating(anchor(100, 100), bubble, viewport, 'right')).toEqual({
      x: 126,
      y: 98,
      placement: 'right',
    });
  });

  it('flips to the other side when the one asked for runs off the screen', () => {
    // At the very top of the page, "top" would put the box above the viewport.
    expect(placeFloating(anchor(100, 10), bubble, viewport, 'top')).toMatchObject({
      y: 36,
      placement: 'bottom',
    });
    expect(placeFloating(anchor(100, 570), bubble, viewport, 'bottom')).toMatchObject({
      y: 540,
      placement: 'top',
    });
    expect(placeFloating(anchor(10, 100), bubble, viewport, 'left')).toMatchObject({
      x: 36,
      placement: 'right',
    });
  });

  it('keeps the side asked for when neither side has room', () => {
    const tall = { width: 80, height: 400 };
    expect(placeFloating(anchor(100, 250), tall, viewport, 'top').placement).toBe('top');
  });

  it('slides along its side to stay inside the screen', () => {
    // A header's last icon: centring would hang the box past the right edge.
    expect(placeFloating(anchor(770, 100), bubble, viewport, 'top').x).toBe(712);
    expect(placeFloating(anchor(0, 100), bubble, viewport, 'top').x).toBe(8);
    expect(placeFloating(anchor(100, 590), bubble, viewport, 'right').y).toBe(568);
  });
});
