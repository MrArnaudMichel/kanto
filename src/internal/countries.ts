/**
 * Country data for the phone mode of `<kt-input>`.
 *
 * Deliberately a short list rather than all 195: an exhaustive picker is a
 * worse experience than a handful of entries and a search box. Applications
 * that need more pass their own list to the element.
 */

export interface KtCountry {
  /** ISO 3166-1 alpha-2, lowercase. */
  readonly id: string;
  readonly name: string;
  /** International dialling code, without the leading `+`. */
  readonly dialCode: string;
  /** Placeholder showing the local format. */
  readonly format: string;
}

export const DEFAULT_COUNTRIES: readonly KtCountry[] = [
  { id: 'us', name: 'United States', dialCode: '1', format: '123-456-7890' },
  { id: 'gb', name: 'United Kingdom', dialCode: '44', format: '7123 456789' },
  { id: 'de', name: 'Germany', dialCode: '49', format: '1234 567890' },
  { id: 'fr', name: 'France', dialCode: '33', format: '1 23 45 67 89' },
  { id: 'be', name: 'Belgium', dialCode: '32', format: '1 23 45 67 89' },
  { id: 'ch', name: 'Switzerland', dialCode: '41', format: '12 345 67 89' },
];

const REGIONAL_INDICATOR_A = 0x1f1e6;
const LETTER_A = 'A'.charCodeAt(0);

/**
 * The flag emoji for a country code, built from regional indicator symbols.
 *
 * This is the one place emoji appear in a Kanto interface. They are here
 * because no flag icon set ships with the system, and a country picker without
 * flags is markedly slower to scan.
 */
export function flagEmoji(id: string): string {
  if (!/^[a-z]{2}$/i.test(id)) return '';
  return String.fromCodePoint(
    ...[...id.toUpperCase()].map(
      (letter) => REGIONAL_INDICATOR_A + letter.charCodeAt(0) - LETTER_A,
    ),
  );
}

/** Keeps only the digits — what gets stored and submitted. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Groups digits for display, per country.
 *
 * North American numbers read as `123 456 7890`, French ones as
 * `6 12 34 56 78` — a single leading digit, then pairs. Everything else falls
 * back to groups of three.
 */
export function formatNationalNumber(digits: string, country: KtCountry | undefined): string {
  if (!digits) return '';

  const groups: string[] = [];
  let rest = digits;

  if (country?.id === 'fr') {
    groups.push(rest.slice(0, 1));
    rest = rest.slice(1);
    while (rest) {
      groups.push(rest.slice(0, 2));
      rest = rest.slice(2);
    }
  } else if (country?.id === 'us' || country?.id === 'ca') {
    for (const size of [3, 3, 4]) {
      if (!rest) break;
      groups.push(rest.slice(0, size));
      rest = rest.slice(size);
    }
    if (rest) groups.push(rest);
  } else {
    while (rest) {
      groups.push(rest.slice(0, 3));
      rest = rest.slice(3);
    }
  }

  return groups.filter(Boolean).join(' ');
}

/** Filters by name, dial code or country code — whatever the user types. */
export function searchCountries(
  countries: readonly KtCountry[],
  query: string,
): readonly KtCountry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return countries;

  return countries.filter(
    (country) =>
      country.name.toLowerCase().includes(needle) ||
      country.dialCode.includes(needle.replace(/^\+/, '')) ||
      country.id === needle,
  );
}
