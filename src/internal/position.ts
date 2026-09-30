/**
 * Placing a floating box — a tooltip bubble — beside the element it belongs
 * to, in viewport coordinates, so it can be drawn with `position: fixed` in
 * the top layer where no ancestor's `overflow` can clip it.
 */

export type Side = 'top' | 'bottom' | 'left' | 'right';

/** Along its side: centred on the anchor, or flush with its start or end — a menu. */
export type Align = 'center' | 'start' | 'end';

/** Where a box of `size` begins along an anchor edge from `start` of `length`. */
function alignAlong(align: Align, start: number, length: number, size: number): number {
  if (align === 'start') return start;
  if (align === 'end') return start + length - size;
  return start + length / 2 - size / 2;
}

export interface Box {
  readonly width: number;
  readonly height: number;
}

export interface Anchor extends Box {
  readonly left: number;
  readonly top: number;
}

/** Between the anchor and the box. */
const GAP = 6;
/** Kept clear between the box and the edge of the viewport. */
const MARGIN = 8;

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * Where to draw `box` on the `side` asked for, or on the opposite side when
 * the one asked for would run off the screen and the other would not. Along
 * its side, the box is centred on the anchor or flush with its start or end, then
 * slid back inside the screen.
 */
export function placeFloating(
  anchor: Anchor,
  box: Box,
  viewport: Box,
  side: Side,
  align: Align = 'center',
): { x: number; y: number; placement: Side } {
  const offset = (on: Side): number => {
    switch (on) {
      case 'top':
        return anchor.top - GAP - box.height;
      case 'bottom':
        return anchor.top + anchor.height + GAP;
      case 'left':
        return anchor.left - GAP - box.width;
      case 'right':
        return anchor.left + anchor.width + GAP;
    }
  };
  const fits = (on: Side): boolean => {
    const at = offset(on);
    const size = on === 'top' || on === 'bottom' ? box.height : box.width;
    const room = on === 'top' || on === 'bottom' ? viewport.height : viewport.width;
    return at >= MARGIN && at + size <= room - MARGIN;
  };

  const placement = !fits(side) && fits(OPPOSITE[side]) ? OPPOSITE[side] : side;

  if (placement === 'top' || placement === 'bottom') {
    const along = alignAlong(align, anchor.left, anchor.width, box.width);
    return {
      x: clamp(along, MARGIN, viewport.width - MARGIN - box.width),
      y: offset(placement),
      placement,
    };
  }
  const along = alignAlong(align, anchor.top, anchor.height, box.height);
  return {
    x: offset(placement),
    y: clamp(along, MARGIN, viewport.height - MARGIN - box.height),
    placement,
  };
}
