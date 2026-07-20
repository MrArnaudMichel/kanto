/** Formatting helpers shared by elements that display data. */

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

/**
 * A human-readable file size.
 *
 * Uses 1024 steps, matching what every desktop file manager shows, and one
 * decimal above a kilobyte — "1.4 MB" reads; "1468006 B" does not.
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';

  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const rounded = unit === 0 ? String(Math.round(value)) : value.toFixed(1);
  return `${rounded} ${UNITS[unit]}`;
}
