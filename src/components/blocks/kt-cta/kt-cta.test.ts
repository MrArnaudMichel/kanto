import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import './kt-cta.js';
import type { KtCta } from 'kanto-ds';

const root = (el: KtCta) => el.shadowRoot!;

describe('kt-cta', () => {
  it('is a section named by its heading, an h2 by default, with its lead', async () => {
    const el = await fixture<KtCta>(
      '<kt-cta heading="Start sending invoices" lead="Free for three months."></kt-cta>',
    );
    const section = root(el).querySelector('section')!;
    const label = root(el).getElementById(section.getAttribute('aria-labelledby')!)!;
    expect(label.textContent!.trim()).toBe('Start sending invoices');
    expect(root(el).querySelector('h2')).not.toBeNull();
    expect(root(el).querySelector('.block-lead')!.textContent).toBe('Free for three months.');
  });

  it('has slots for actions and a note', async () => {
    const el = await fixture<KtCta>('<kt-cta heading="x"></kt-cta>');
    const names = [...root(el).querySelectorAll('slot')].map((slot) => slot.name);
    expect(names).toEqual(expect.arrayContaining(['actions', 'note']));
  });

  it('sits on a panel by default, and reflects its variant and layout', async () => {
    const el = await fixture<KtCta>('<kt-cta heading="x"></kt-cta>');
    expect(el.getAttribute('variant')).toBe('panel');
    expect(el.getAttribute('layout')).toBe('stacked');
    el.variant = 'plain';
    el.layout = 'inline';
    await el.updateComplete;
    expect(el.getAttribute('variant')).toBe('plain');
    expect(el.getAttribute('layout')).toBe('inline');
  });

  it('takes a heading level', async () => {
    const el = await fixture<KtCta>('<kt-cta heading="x" heading-level="3"></kt-cta>');
    expect(root(el).querySelector('h3')).not.toBeNull();
  });
});
