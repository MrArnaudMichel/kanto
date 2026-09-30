import { describe, expect, it } from 'vitest';
import {
  Metadata,
  getCountryCallingCode,
  isPossiblePhoneNumber,
  type CountryCode,
} from 'libphonenumber-js';
import {
  DEFAULT_COUNTRIES,
  digitsOnly,
  flagEmoji,
  formatNationalNumber,
  leadingTrunkPrefix,
  searchCountries,
} from './countries.js';

const france = DEFAULT_COUNTRIES.find((c) => c.id === 'fr');
const usa = DEFAULT_COUNTRIES.find((c) => c.id === 'us');
const country = (id: string) => DEFAULT_COUNTRIES.find((c) => c.id === id);

describe('DEFAULT_COUNTRIES', () => {
  it('covers most of the planet, once each', () => {
    const ids = DEFAULT_COUNTRIES.map((c) => c.id);
    expect(ids.length).toBeGreaterThanOrEqual(90);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('lists them by name, so the panel can be scanned', () => {
    const names = DEFAULT_COUNTRIES.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
  });

  it('gives every country a code, a dial code and a digits-only format', () => {
    for (const c of DEFAULT_COUNTRIES) {
      expect(c.id).toMatch(/^[a-z]{2}$/);
      expect(c.dialCode).toMatch(/^\d{1,4}$/);
      expect(c.format).toMatch(/^\d+([ -]\d+)*$/);
      if (c.trunkPrefix !== undefined) expect(c.format.startsWith(c.trunkPrefix)).toBe(false);
    }
  });
});

/**
 * Checked against libphonenumber's metadata, the reference for phone number
 * formats, which is a dev dependency only: the shipped list stays a small
 * hand-written table.
 */
describe('DEFAULT_COUNTRIES against libphonenumber', () => {
  /**
   * Countries whose national prefix can also begin a number, so a leading
   * digit proves nothing and the field must not flag it.
   */
  const PREFIX_ALSO_STARTS_NUMBERS: Record<string, string> = {
    ru: '8 is the trunk prefix, and Saint Petersburg is 812',
    kz: '8 is the trunk prefix, and toll-free numbers are 800',
  };

  const plan = new Metadata();
  const nationalPrefix = (id: string): string | undefined => {
    plan.selectNumberingPlan(id.toUpperCase() as CountryCode);
    // At runtime the plan has nationalPrefix(); the published types leave it out.
    const numbering = plan.numberingPlan as unknown as { nationalPrefix(): string | undefined };
    return numbering.nationalPrefix() || undefined;
  };

  for (const country of DEFAULT_COUNTRIES) {
    it(`${country.name}: dial code, trunk prefix and format`, () => {
      const code = country.id.toUpperCase() as CountryCode;
      expect(country.dialCode).toBe(getCountryCallingCode(code));
      expect(country.trunkPrefix).toBe(
        country.id in PREFIX_ALSO_STARTS_NUMBERS ? undefined : nationalPrefix(country.id),
      );
      expect(isPossiblePhoneNumber(country.format.replace(/\D/g, ''), code)).toBe(true);
    });
  }
});

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

  it('groups every other country the way its format does', () => {
    expect(formatNationalNumber('1234567890', country('de'))).toBe('1234 567890');
    expect(formatNationalNumber('9012345678', country('jp'))).toBe('90 1234 5678');
  });

  it('keeps digits beyond the format in a last group', () => {
    expect(formatNationalNumber('612345678901', france)).toBe('6 12 34 56 78 901');
  });

  it('groups in threes for a country it knows nothing about', () => {
    expect(formatNationalNumber('1234567', undefined)).toBe('123 456 7');
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

  it('matches a dial code from its start, not anywhere in it', () => {
    // "44" is inside Angola's 244: a dial code is read left to right.
    expect(searchCountries(DEFAULT_COUNTRIES, '+44').map((c) => c.id)).toEqual(['gb']);
  });

  it('ignores accents in names', () => {
    expect(searchCountries(DEFAULT_COUNTRIES, 'cote').map((c) => c.id)).toEqual(['ci']);
  });

  it('matches on dial code, with or without the plus', () => {
    expect(searchCountries(DEFAULT_COUNTRIES, '+41').map((c) => c.id)).toEqual(['ch']);
    expect(searchCountries(DEFAULT_COUNTRIES, '49').map((c) => c.id)).toEqual(['de']);
  });

  it('matches on the country code exactly', () => {
    expect(searchCountries(DEFAULT_COUNTRIES, 'gb').map((c) => c.id)).toEqual(['gb']);
  });
});

describe('leadingTrunkPrefix', () => {
  it('returns the national prefix a number was typed with', () => {
    expect(leadingTrunkPrefix('0612345678', france)).toBe('0');
    expect(leadingTrunkPrefix('14155552671', usa)).toBe('1');
    expect(leadingTrunkPrefix('06201234567', country('hu'))).toBe('06');
  });

  it('accepts a number typed without it', () => {
    expect(leadingTrunkPrefix('612345678', france)).toBeUndefined();
    expect(leadingTrunkPrefix('', france)).toBeUndefined();
  });

  it('leaves alone countries where a leading 0 belongs to the number', () => {
    // An Italian landline keeps its 0 after +39.
    expect(leadingTrunkPrefix('0612345678', country('it'))).toBeUndefined();
    expect(leadingTrunkPrefix('0612345678', undefined)).toBeUndefined();
  });
});
