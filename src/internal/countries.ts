/**
 * Country data for the phone mode of `<kt-input>`.
 *
 * Most of the planet by population rather than all 195 — the panel has a
 * search box, and the long tail of microstates mostly adds scrolling.
 * Applications that need a different set pass their own list to the element.
 */

export interface KtCountry {
  /** ISO 3166-1 alpha-2, lowercase. */
  readonly id: string;
  readonly name: string;
  /** International dialling code, without the leading `+`. */
  readonly dialCode: string;
  /**
   * A national number as it is written without the trunk prefix, used as the
   * placeholder. Its digit groups are also how a typed number is grouped.
   */
  readonly format: string;
  /**
   * What a number starts with when dialled from inside the country — the `0`
   * of `06 12 34 56 78` — and never after the dial code. Absent where no such
   * prefix exists, or where it can also begin a number: an Italian landline
   * keeps its 0 after +39.
   */
  readonly trunkPrefix?: string;
}

export const DEFAULT_COUNTRIES: readonly KtCountry[] = [
  { id: 'al', name: 'Albania', dialCode: '355', format: '67 212 3456', trunkPrefix: '0' },
  { id: 'dz', name: 'Algeria', dialCode: '213', format: '551 23 45 67', trunkPrefix: '0' },
  { id: 'ao', name: 'Angola', dialCode: '244', format: '923 123 456' },
  { id: 'ar', name: 'Argentina', dialCode: '54', format: '11 2345 6789', trunkPrefix: '0' },
  { id: 'au', name: 'Australia', dialCode: '61', format: '412 345 678', trunkPrefix: '0' },
  { id: 'at', name: 'Austria', dialCode: '43', format: '664 1234567', trunkPrefix: '0' },
  { id: 'bd', name: 'Bangladesh', dialCode: '880', format: '1812 345678', trunkPrefix: '0' },
  { id: 'be', name: 'Belgium', dialCode: '32', format: '1 23 45 67 89', trunkPrefix: '0' },
  { id: 'bo', name: 'Bolivia', dialCode: '591', format: '7123 4567', trunkPrefix: '0' },
  { id: 'br', name: 'Brazil', dialCode: '55', format: '11 91234 5678', trunkPrefix: '0' },
  { id: 'bg', name: 'Bulgaria', dialCode: '359', format: '87 123 4567', trunkPrefix: '0' },
  { id: 'cm', name: 'Cameroon', dialCode: '237', format: '6 71 23 45 67' },
  { id: 'ca', name: 'Canada', dialCode: '1', format: '506-234-5678', trunkPrefix: '1' },
  { id: 'cl', name: 'Chile', dialCode: '56', format: '9 1234 5678' },
  { id: 'cn', name: 'China', dialCode: '86', format: '131 2345 6789', trunkPrefix: '0' },
  { id: 'co', name: 'Colombia', dialCode: '57', format: '321 123 4567', trunkPrefix: '0' },
  { id: 'cr', name: 'Costa Rica', dialCode: '506', format: '8312 3456' },
  { id: 'ci', name: "Côte d'Ivoire", dialCode: '225', format: '01 23 45 67 89' },
  { id: 'hr', name: 'Croatia', dialCode: '385', format: '91 234 5678', trunkPrefix: '0' },
  { id: 'cy', name: 'Cyprus', dialCode: '357', format: '96 123456' },
  { id: 'cz', name: 'Czechia', dialCode: '420', format: '601 123 456' },
  { id: 'dk', name: 'Denmark', dialCode: '45', format: '32 12 34 56' },
  { id: 'cd', name: 'DR Congo', dialCode: '243', format: '991 234 567', trunkPrefix: '0' },
  { id: 'ec', name: 'Ecuador', dialCode: '593', format: '99 123 4567', trunkPrefix: '0' },
  { id: 'eg', name: 'Egypt', dialCode: '20', format: '100 123 4567', trunkPrefix: '0' },
  { id: 'ee', name: 'Estonia', dialCode: '372', format: '5123 4567' },
  { id: 'et', name: 'Ethiopia', dialCode: '251', format: '91 123 4567', trunkPrefix: '0' },
  { id: 'fi', name: 'Finland', dialCode: '358', format: '41 234 5678', trunkPrefix: '0' },
  { id: 'fr', name: 'France', dialCode: '33', format: '1 23 45 67 89', trunkPrefix: '0' },
  { id: 'ge', name: 'Georgia', dialCode: '995', format: '555 123 456', trunkPrefix: '0' },
  { id: 'de', name: 'Germany', dialCode: '49', format: '1234 567890', trunkPrefix: '0' },
  { id: 'gh', name: 'Ghana', dialCode: '233', format: '23 123 4567', trunkPrefix: '0' },
  { id: 'gr', name: 'Greece', dialCode: '30', format: '691 234 5678' },
  { id: 'gt', name: 'Guatemala', dialCode: '502', format: '5123 4567' },
  { id: 'hk', name: 'Hong Kong', dialCode: '852', format: '5123 4567' },
  { id: 'hu', name: 'Hungary', dialCode: '36', format: '20 123 4567', trunkPrefix: '06' },
  { id: 'is', name: 'Iceland', dialCode: '354', format: '611 1234' },
  { id: 'in', name: 'India', dialCode: '91', format: '81234 56789', trunkPrefix: '0' },
  { id: 'id', name: 'Indonesia', dialCode: '62', format: '812 3456 7890', trunkPrefix: '0' },
  { id: 'ir', name: 'Iran', dialCode: '98', format: '912 345 6789', trunkPrefix: '0' },
  { id: 'iq', name: 'Iraq', dialCode: '964', format: '791 234 5678', trunkPrefix: '0' },
  { id: 'ie', name: 'Ireland', dialCode: '353', format: '85 123 4567', trunkPrefix: '0' },
  { id: 'il', name: 'Israel', dialCode: '972', format: '50 234 5678', trunkPrefix: '0' },
  { id: 'it', name: 'Italy', dialCode: '39', format: '312 345 6789' },
  { id: 'jp', name: 'Japan', dialCode: '81', format: '90 1234 5678', trunkPrefix: '0' },
  { id: 'jo', name: 'Jordan', dialCode: '962', format: '7 9012 3456', trunkPrefix: '0' },
  { id: 'kz', name: 'Kazakhstan', dialCode: '7', format: '771 000 9998' },
  { id: 'ke', name: 'Kenya', dialCode: '254', format: '712 123456', trunkPrefix: '0' },
  { id: 'lv', name: 'Latvia', dialCode: '371', format: '2123 4567' },
  { id: 'lb', name: 'Lebanon', dialCode: '961', format: '71 123 456', trunkPrefix: '0' },
  { id: 'lt', name: 'Lithuania', dialCode: '370', format: '612 34567', trunkPrefix: '0' },
  { id: 'lu', name: 'Luxembourg', dialCode: '352', format: '628 123 456' },
  { id: 'my', name: 'Malaysia', dialCode: '60', format: '12 345 6789', trunkPrefix: '0' },
  { id: 'mx', name: 'Mexico', dialCode: '52', format: '55 1234 5678' },
  { id: 'ma', name: 'Morocco', dialCode: '212', format: '650 123456', trunkPrefix: '0' },
  { id: 'np', name: 'Nepal', dialCode: '977', format: '984 1234567', trunkPrefix: '0' },
  { id: 'nl', name: 'Netherlands', dialCode: '31', format: '6 12345678', trunkPrefix: '0' },
  { id: 'nz', name: 'New Zealand', dialCode: '64', format: '21 123 4567', trunkPrefix: '0' },
  { id: 'ng', name: 'Nigeria', dialCode: '234', format: '802 123 4567', trunkPrefix: '0' },
  { id: 'mk', name: 'North Macedonia', dialCode: '389', format: '72 345 678', trunkPrefix: '0' },
  { id: 'no', name: 'Norway', dialCode: '47', format: '406 12 345' },
  { id: 'pk', name: 'Pakistan', dialCode: '92', format: '301 2345678', trunkPrefix: '0' },
  { id: 'pa', name: 'Panama', dialCode: '507', format: '6123 4567' },
  { id: 'pe', name: 'Peru', dialCode: '51', format: '912 345 678', trunkPrefix: '0' },
  { id: 'ph', name: 'Philippines', dialCode: '63', format: '905 123 4567', trunkPrefix: '0' },
  { id: 'pl', name: 'Poland', dialCode: '48', format: '512 345 678' },
  { id: 'pt', name: 'Portugal', dialCode: '351', format: '912 345 678' },
  { id: 'qa', name: 'Qatar', dialCode: '974', format: '3312 3456' },
  { id: 'ro', name: 'Romania', dialCode: '40', format: '712 034 567', trunkPrefix: '0' },
  { id: 'ru', name: 'Russia', dialCode: '7', format: '912 345 67 89' },
  { id: 'sa', name: 'Saudi Arabia', dialCode: '966', format: '51 234 5678', trunkPrefix: '0' },
  { id: 'sn', name: 'Senegal', dialCode: '221', format: '70 123 45 67' },
  { id: 'rs', name: 'Serbia', dialCode: '381', format: '60 123 4567', trunkPrefix: '0' },
  { id: 'sg', name: 'Singapore', dialCode: '65', format: '8123 4567' },
  { id: 'sk', name: 'Slovakia', dialCode: '421', format: '912 123 456', trunkPrefix: '0' },
  { id: 'si', name: 'Slovenia', dialCode: '386', format: '31 234 567', trunkPrefix: '0' },
  { id: 'za', name: 'South Africa', dialCode: '27', format: '71 123 4567', trunkPrefix: '0' },
  { id: 'kr', name: 'South Korea', dialCode: '82', format: '10 1234 5678', trunkPrefix: '0' },
  { id: 'es', name: 'Spain', dialCode: '34', format: '612 34 56 78' },
  { id: 'lk', name: 'Sri Lanka', dialCode: '94', format: '71 234 5678', trunkPrefix: '0' },
  { id: 'se', name: 'Sweden', dialCode: '46', format: '70 123 45 67', trunkPrefix: '0' },
  { id: 'ch', name: 'Switzerland', dialCode: '41', format: '12 345 67 89', trunkPrefix: '0' },
  { id: 'tw', name: 'Taiwan', dialCode: '886', format: '912 345 678', trunkPrefix: '0' },
  { id: 'tz', name: 'Tanzania', dialCode: '255', format: '621 234 567', trunkPrefix: '0' },
  { id: 'th', name: 'Thailand', dialCode: '66', format: '81 234 5678', trunkPrefix: '0' },
  { id: 'tn', name: 'Tunisia', dialCode: '216', format: '20 123 456' },
  { id: 'tr', name: 'Türkiye', dialCode: '90', format: '501 234 56 78', trunkPrefix: '0' },
  { id: 'ug', name: 'Uganda', dialCode: '256', format: '712 345678', trunkPrefix: '0' },
  { id: 'ua', name: 'Ukraine', dialCode: '380', format: '50 123 4567', trunkPrefix: '0' },
  {
    id: 'ae',
    name: 'United Arab Emirates',
    dialCode: '971',
    format: '50 123 4567',
    trunkPrefix: '0',
  },
  { id: 'gb', name: 'United Kingdom', dialCode: '44', format: '7123 456789', trunkPrefix: '0' },
  { id: 'us', name: 'United States', dialCode: '1', format: '201-555-0123', trunkPrefix: '1' },
  { id: 'uy', name: 'Uruguay', dialCode: '598', format: '94 231 234', trunkPrefix: '0' },
  { id: 've', name: 'Venezuela', dialCode: '58', format: '412 123 4567', trunkPrefix: '0' },
  { id: 'vn', name: 'Vietnam', dialCode: '84', format: '91 234 5678', trunkPrefix: '0' },
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
 * Groups digits for display, the way the country's `format` groups them:
 * `1 23 45 67 89` makes `6 12 34 56 78`. Digits past the format go in one
 * last group rather than being dropped, and a country with no format falls
 * back to threes.
 */
export function formatNationalNumber(digits: string, country: KtCountry | undefined): string {
  if (!digits) return '';

  const sizes = country ? (country.format.match(/\d+/g) ?? []).map((run) => run.length) : [];
  const groups: string[] = [];
  let rest = digits;

  for (const size of sizes) {
    if (!rest) break;
    groups.push(rest.slice(0, size));
    rest = rest.slice(size);
  }
  if (sizes.length > 0) {
    if (rest) groups.push(rest);
  } else {
    while (rest) {
      groups.push(rest.slice(0, 3));
      rest = rest.slice(3);
    }
  }

  return groups.join(' ');
}

/**
 * The trunk prefix a number was typed with, if any. Someone used to dialling
 * `06 12 34 56 78` types the 0 after +33 too, and the result is not a number
 * that exists.
 */
export function leadingTrunkPrefix(
  digits: string,
  country: KtCountry | undefined,
): string | undefined {
  const prefix = country?.trunkPrefix;
  return prefix && digits.startsWith(prefix) ? prefix : undefined;
}

/** Lowercase, without accents: "Côte" is found by typing "cote". */
function fold(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/** Filters by name, dial code or country code — whatever the user types. */
export function searchCountries(
  countries: readonly KtCountry[],
  query: string,
): readonly KtCountry[] {
  const needle = fold(query.trim());
  if (!needle) return countries;

  // From the start: "44" is the UK, not also Angola's 244.
  const dial = needle.replace(/^\+/, '');
  return countries.filter(
    (country) =>
      fold(country.name).includes(needle) ||
      (dial !== '' && country.dialCode.startsWith(dial)) ||
      country.id === needle,
  );
}
