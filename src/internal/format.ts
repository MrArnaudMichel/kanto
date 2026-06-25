/** Formatting helpers shared by elements that display data. */

const UNITS = ['o', 'Ko', 'Mo', 'Go', 'To'] as const;

/**
 * A file size in French units: octets, kilo-octets, méga-octets.
 *
 * Uses 1024 steps, matching what every desktop file manager shows, and one
 * decimal above a kilobyte — "1,4 Mo" reads; "1 468 006 o" does not.
 */
export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '';

  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }

  const rounded = unit === 0 ? String(Math.round(value)) : value.toFixed(1).replace('.', ',');
  return `${rounded} ${UNITS[unit]}`;
}
