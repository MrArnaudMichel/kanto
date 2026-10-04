import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import './kt-hero.js';
import type { KtHero } from 'kanto-ds';

const root = (el: KtHero) => el.shadowRoot!;

describe('kt-hero', () => {
  it('opens the page: a section named by its heading, an h1, and its lead', async () => {
    const el = await fixture<KtHero>(
      '<kt-hero heading="Invoices that pay themselves" lead="Send, chase and reconcile, in one place."></kt-hero>',
    );
    const section = root(el).querySelector('section')!;
    const labelledBy = root(el).getElementById(section.getAttribute('aria-labelledby')!)!;
    expect(labelledBy.textContent!.trim()).toBe('Invoices that pay themselves');
    expect(root(el).querySelector('h1')).not.toBeNull();
    expect(root(el).querySelector('.block-lead')!.textContent).toContain(
      'Send, chase and reconcile',
    );
  });

  it('centres itself by default, and takes the start', async () => {
    const el = await fixture<KtHero>('<kt-hero heading="x"></kt-hero>');
    expect(el.getAttribute('align')).toBe('center');
    const start = await fixture<KtHero>('<kt-hero heading="x" align="start"></kt-hero>');
    expect(start.getAttribute('align')).toBe('start');
  });

  it('has slots for an announcement, actions, a note and media', async () => {
    const el = await fixture<KtHero>('<kt-hero heading="x"></kt-hero>');
    const names = [...root(el).querySelectorAll('slot')].map((slot) => slot.name);
    expect(names).toEqual(expect.arrayContaining(['announcement', 'actions', 'note', 'media']));
  });

  it('sets its media beside the words with layout="split"', async () => {
    const el = await fixture<KtHero>('<kt-hero heading="x" layout="split"></kt-hero>');
    expect(el.getAttribute('layout')).toBe('split');
  });

  it('takes a heading level', async () => {
    const el = await fixture<KtHero>('<kt-hero heading="x" heading-level="2"></kt-hero>');
    expect(root(el).querySelector('h2')).not.toBeNull();
  });
});
