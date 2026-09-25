import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixture, formFixture, settle } from '#test/fixture';
import { defaultStrings, onStringsChange, resetStrings, setStrings, strings } from './strings.js';
import '../components/forms/kt-select/kt-select.js';
import '../components/forms/kt-input/kt-input.js';
import '../components/data/kt-pagination/kt-pagination.js';
import '../components/data/kt-table/kt-table.js';
import type { KtInput, KtPagination, KtSelect, KtTable } from 'kanto-ds';

afterEach(() => {
  resetStrings();
});

describe('the strings registry', () => {
  it('starts in English', () => {
    expect(strings().clear).toBe('Clear');
    expect(strings().pageOf(2, 7)).toBe('Page 2 / 7');
  });

  it('replaces only what it is given', () => {
    setStrings({ clear: 'Effacer' });

    expect(strings().clear).toBe('Effacer');
    expect(strings().close).toBe(defaultStrings.close);
  });

  it('goes back to the defaults', () => {
    setStrings({ clear: 'Effacer' });
    resetStrings();
    expect(strings().clear).toBe('Clear');
  });

  it('tells its listeners, until they unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = onStringsChange(listener);

    setStrings({ clear: 'Effacer' });
    unsubscribe();
    setStrings({ clear: 'Löschen' });

    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('elements and the strings registry', () => {
  const text = (el: Element, selector: string) =>
    el.shadowRoot!.querySelector(selector)!.textContent!.trim();

  it('writes its copy from the registry', async () => {
    setStrings({ select: 'Choisir' });
    const el = await fixture<KtSelect>('<kt-select></kt-select>');

    expect(text(el, '.trigger')).toContain('Choisir');
  });

  it('follows a change of language at runtime', async () => {
    const el = await fixture<KtTable>('<kt-table></kt-table>');
    expect(text(el, '.placeholder')).toBe('No data to display');

    setStrings({ noData: 'Aucune donnée' });
    await settle(el);

    expect(text(el, '.placeholder')).toBe('Aucune donnée');
  });

  it('lets a property win over the registry, empty string included', async () => {
    setStrings({ select: 'Choisir' });
    const el = await fixture<KtSelect>('<kt-select placeholder="Région"></kt-select>');
    expect(text(el, '.trigger')).toContain('Région');

    el.placeholder = '';
    await settle(el);
    expect(text(el, '.trigger')).not.toContain('Choisir');
  });

  it('lets a translation put the words in its own order', async () => {
    setStrings({ pageOf: (page, total) => `${page} sur ${total}` });
    const el = await fixture<KtPagination>(
      '<kt-pagination page="2" total-pages="7"></kt-pagination>',
    );

    expect(el.shadowRoot!.textContent!.replace(/\s+/g, ' ')).toContain('2 sur 7');
  });

  it('translates the accessible names nobody sees', async () => {
    setStrings({ clear: 'Effacer' });
    const el = await fixture<KtInput>('<kt-input value="x" clearable></kt-input>');

    expect(el.shadowRoot!.querySelector('.clear')!.getAttribute('aria-label')).toBe('Effacer');
  });

  it('re-reports its validation message in the new language', async () => {
    const { element, internals } = await formFixture<KtInput>('<kt-input required></kt-input>');
    expect(internals.setValidity).toHaveBeenLastCalledWith(
      { valueMissing: true, customError: false },
      'This field is required.',
      undefined,
    );

    setStrings({ required: 'Ce champ est obligatoire.' });
    await settle(element);

    expect(internals.setValidity).toHaveBeenLastCalledWith(
      { valueMissing: true, customError: false },
      'Ce champ est obligatoire.',
      undefined,
    );
  });
});
