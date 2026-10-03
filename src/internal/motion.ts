/**
 * Motion read from the theme. The duration tokens are where reduced motion is
 * honoured — they are all zero under `prefers-reduced-motion: reduce` — so
 * script-driven animations read them instead of carrying their own numbers,
 * and are skipped outright when they come back zero.
 */

/** A CSS time — `0.2s`, `160ms` — in milliseconds; zero when it is not one. */
export function parseTime(value: string): number {
  const match = /^\s*(\d*\.?\d+)(ms|s)\s*$/.exec(value);
  if (!match) return 0;
  const amount = Number(match[1]);
  return match[2] === 's' ? amount * 1000 : amount;
}

/** A duration token's value at `element`, in milliseconds. */
export function durationOf(element: Element, token: `--duration-${string}`): number {
  return parseTime(getComputedStyle(element).getPropertyValue(token));
}

/** The theme's standard easing at `element`, for the Web Animations API. */
export function easingOf(element: Element): string {
  return getComputedStyle(element).getPropertyValue('--easing-standard').trim() || 'ease';
}
