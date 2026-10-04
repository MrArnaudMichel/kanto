import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-description-list.js';
import type { KtDescriptionList } from 'kanto-ds';

const ITEMS = [
  { term: 'Invoice', detail: 'INV-2041' },
  { term: 'Customer', detail: 'Acme Corp' },
  { term: 'Amount', detail: '$1,200' },
];

async function mount(markup = '<kt-description-list></kt-description-list>') {
  const el = await fixture<KtDescriptionList>(markup);
  el.items = ITEMS;
  await settle(el);
  return el;
}

describe('kt-description-list', () => {
  it('is a <dl>: a term and its detail per item, grouped', async () => {
    const el = await mount();
    const dl = el.shadowRoot!.querySelector('dl')!;
    const groups = [...dl.children];
    expect(groups).toHaveLength(3);
    for (const [index, group] of groups.entries()) {
      expect(group.localName).toBe('div');
      expect(group.querySelector('dt')!.textContent!.trim()).toBe(ITEMS[index]!.term);
      expect(group.querySelector('dd')!.textContent!.trim()).toBe(ITEMS[index]!.detail);
    }
  });

  it('is named when asked', async () => {
    const el = await mount('<kt-description-list label="Invoice details"></kt-description-list>');
    expect(el.shadowRoot!.querySelector('dl')!.getAttribute('aria-label')).toBe('Invoice details');
  });

  it('reflects its layout, columns and rules', async () => {
    const el = await mount(
      '<kt-description-list layout="stacked" columns="3" bordered></kt-description-list>',
    );
    expect(el.getAttribute('layout')).toBe('stacked');
    expect(el.getAttribute('columns')).toBe('3');
    expect(el.hasAttribute('bordered')).toBe(true);
  });

  it('defaults to terms beside their details', async () => {
    const el = await mount();
    expect(el.getAttribute('layout')).toBe('horizontal');
  });

  it('shows a dash for a missing detail, said as "none" by nothing at all', async () => {
    const el = await fixture<KtDescriptionList>('<kt-description-list></kt-description-list>');
    el.items = [{ term: 'Purchase order', detail: '' }];
    await settle(el);
    const dd = el.shadowRoot!.querySelector('dd')!;
    expect(dd.textContent!.trim()).toBe('—');
  });

  it('draws nothing while it has no items', async () => {
    const el = await fixture<KtDescriptionList>('<kt-description-list></kt-description-list>');
    expect(el.shadowRoot!.querySelector('dl')!.children).toHaveLength(0);
  });
});
