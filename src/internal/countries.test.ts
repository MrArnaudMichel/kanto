import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COUNTRIES,
  digitsOnly,
  flagEmoji,
  formatNationalNumber,
  searchCountries,
} from './countries.js';

const france = DEFAULT_COUNTRIES.find((c) => c.id === 'fr');
const usa = DEFAULT_COUNTRIES.find((c) => c.id === 'us');

describe('flagEmoji', () => {
  it('builds the flag from regional indicator symbols', () => {
    expect(flagEmoji('fr')).toBe('🇫🇷');
    expect(flagEmoji('US')).toBe('🇺🇸');
  });

  it('returns nothing for a code that is not two letters', () => {
    expect(flagEmoji('')).toBe('');
    expect(flagEmoji('fra')).toBe('');
    expect(flagEmoji('33')).toBe('');
  });
});

describe('digitsOnly', () => {
  it('strips everything a user might type between the digits', () => {
    expect(digitsOnly('+33 (0)6 12-34.56 78')).toBe('330612345678');
  });
});

describe('formatNationalNumber', () => {
  it('groups French numbers as one digit then pairs', () => {
    expect(formatNationalNumber('612345678', france)).toBe('6 12 34 56 78');
  });

  it('groups North American numbers as 3-3-4', () => {
    expect(formatNationalNumber('1234567890', usa)).toBe('123 456 7890');
  });

  it('groups everything else in threes', () => {
    const germany = DEFAULT_COUNTRIES.find((c) => c.id === 'de');
    expect(formatNationalNumber('1234567890', germany)).toBe('123 456 789 0');
  });

  it('formats a partial number as it is typed', () => {
    expect(formatNationalNumber('6', france)).toBe('6');
    expect(formatNationalNumber('61', france)).toBe('6 1');
    expect(formatNationalNumber('6123', france)).toBe('6 12 3');
  });

  it('returns nothing for an empty value', () => {
    expect(formatNationalNumber('', france)).toBe('');
  });
});

describe('searchCountries', () => {
  it('returns everything for an empty query', () => {
    expect(searchCountries(DEFAULT_COUNTRIES, '  ')).toHaveLength(DEFAULT_COUNTRIES.length);
  });

  it('matches on name, case- and accent-insensitively enough to be useful', () => {
    expect(searchCountries(DEFAULT_COUNTRIES, 'belg').map((c) => c.id)).toEqual(['be']);
  });

  it('matches on dial code, with or without the plus', () => {
    expect(searchCountries(DEFAULT_COUNTRIES, '+41').map((c) => c.id)).toEqual(['ch']);
    expect(searchCountries(DEFAULT_COUNTRIES, '49').map((c) => c.id)).toEqual(['de']);
  });

  it('matches on the country code exactly', () => {
    expect(searchCountries(DEFAULT_COUNTRIES, 'gb').map((c) => c.id)).toEqual(['gb']);
  });
});
