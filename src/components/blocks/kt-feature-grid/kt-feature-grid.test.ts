import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import './kt-feature-grid.js';
import type { KtFeatureGrid } from 'kanto-ds';

const root = (el: KtFeatureGrid) => el.shadowRoot!;

const FEATURES = [
  { icon: 'zap', title: 'Fast', description: 'Sent in a second.' },
  { title: 'Reconciled', description: 'Matched to the bank, line by line.', href: '/reconcile' },
];

async function grid(markup = '<kt-feature-grid heading="Why teams switch"></kt-feature-grid>') {
  const el = await fixture<KtFeatureGrid>(markup);
  el.features = FEATURES;
  await el.updateComplete;
  return el;
}

describe('kt-feature-grid', () => {
  it('is a section named by its heading, an h2 by default', async () => {
    const el = await grid(
      '<kt-feature-grid heading="Why teams switch" lead="Three reasons."></kt-feature-grid>',
    );
    const section = root(el).querySelector('section')!;
    const label = root(el).getElementById(section.getAttribute('aria-labelledby')!)!;
    expect(label.textContent!.trim()).toBe('Why teams switch');
    expect(root(el).querySelector('h2')).not.toBeNull();
    expect(root(el).querySelector('.block-lead')!.textContent).toBe('Three reasons.');
  });

  it('draws each feature as a list item: its title a level under, and its description', async () => {
    const el = await grid();
    const items = root(el).querySelectorAll('ul > li');
    expect(items).toHaveLength(2);
    expect(items[0]!.querySelector('h3')!.textContent!.trim()).toBe('Fast');
    expect(items[0]!.querySelector('p')!.textContent).toBe('Sent in a second.');
  });

  it('puts its titles a level under its own heading', async () => {
    const el = await grid('<kt-feature-grid heading="x" heading-level="3"></kt-feature-grid>');
    expect(root(el).querySelector('h3.block-heading')).not.toBeNull();
    expect(root(el).querySelectorAll('li h4')).toHaveLength(2);
  });

  it('draws an icon, hidden from assistive tech, only when given one', async () => {
    const el = await grid();
    const [first, second] = root(el).querySelectorAll('li');
    const icon = first!.querySelector('kt-icon')!;
    expect(icon.getAttribute('name')).toBe('zap');
    expect(icon.closest('[aria-hidden="true"]')).not.toBeNull();
    expect(second!.querySelector('kt-icon')).toBeNull();
  });

  it('links a feature that has an href, from its title', async () => {
    const el = await grid();
    const link = root(el).querySelectorAll('li')[1]!.querySelector('h3 a')!;
    expect(link.getAttribute('href')).toBe('/reconcile');
    expect(link.textContent!.trim()).toBe('Reconciled');
    expect(root(el).querySelectorAll('li')[0]!.querySelector('a')).toBeNull();
  });

  it('has three columns and no cards by default, and reflects both', async () => {
    const el = await grid();
    expect(el.getAttribute('columns')).toBe('3');
    expect(el.getAttribute('variant')).toBe('plain');
    el.columns = 2;
    el.variant = 'card';
    await el.updateComplete;
    expect(el.getAttribute('columns')).toBe('2');
    expect(el.getAttribute('variant')).toBe('card');
  });
});
