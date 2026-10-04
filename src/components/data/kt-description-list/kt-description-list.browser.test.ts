/** Terms beside their details when wide, over them when narrow; columns when stacked. */
import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-description-list.js';
import type { KtDescriptionList } from 'kanto-ds';

async function mount(width: number, attributes = '') {
  const el = await fixture<KtDescriptionList>(
    `<kt-description-list ${attributes} style="width: ${width}px"></kt-description-list>`,
  );
  el.items = [
    { term: 'Invoice', detail: 'INV-2041' },
    { term: 'Customer', detail: 'Acme Corp' },
    { term: 'Amount', detail: '$1,200' },
  ];
  await settle(el);
  return el;
}

const first = (el: KtDescriptionList, tag: 'dt' | 'dd') =>
  el.shadowRoot!.querySelector(tag)!.getBoundingClientRect();

describe('kt-description-list, laid out', () => {
  it('sets a term beside its detail when wide', async () => {
    const el = await mount(720);
    expect(first(el, 'dd').left).toBeGreaterThan(first(el, 'dt').right);
    expect(
      Math.round(first(el, 'dd').left - el.getBoundingClientRect().left),
    ).toBeGreaterThanOrEqual(180);
  });

  it('sets it under its detail when narrow', async () => {
    const el = await mount(320);
    expect(first(el, 'dd').top).toBeGreaterThanOrEqual(first(el, 'dt').bottom - 1);
  });

  it('runs stacked items in columns where they fit, in one where they do not', async () => {
    const wide = await mount(900, 'layout="stacked" columns="3"');
    const items = [...wide.shadowRoot!.querySelectorAll('.item')].map((item) =>
      item.getBoundingClientRect(),
    );
    expect(new Set(items.map((rect) => Math.round(rect.top))).size).toBe(1);

    const narrow = await mount(360, 'layout="stacked" columns="3"');
    const stacked = [...narrow.shadowRoot!.querySelectorAll('.item')].map((item) =>
      item.getBoundingClientRect(),
    );
    expect(new Set(stacked.map((rect) => Math.round(rect.top))).size).toBe(3);
  });
});
