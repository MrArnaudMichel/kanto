import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-accordion.js';
import '../kt-collapsible/kt-collapsible.js';
import type { KtAccordion, KtCollapsible } from 'kanto-ds';

const MARKUP = (attributes = '') => `<kt-accordion ${attributes}>
  <kt-collapsible heading="Shipping">Three to five days.</kt-collapsible>
  <kt-collapsible heading="Returns">Thirty days.</kt-collapsible>
  <kt-collapsible heading="Warranty">Two years.</kt-collapsible>
</kt-accordion>`;

const sections = (el: KtAccordion) => [...el.querySelectorAll<KtCollapsible>('kt-collapsible')];

async function open(section: KtCollapsible) {
  section.shadowRoot!.querySelector('summary')!.click();
  await settle(section);
}

describe('kt-accordion', () => {
  it('keeps one section open: opening one closes the others', async () => {
    const el = await fixture<KtAccordion>(MARKUP());
    const [shipping, returns] = sections(el);
    await open(shipping!);
    expect(shipping!.open).toBe(true);
    await open(returns!);
    await settle(el);
    expect(returns!.open).toBe(true);
    expect(shipping!.open).toBe(false);
  });

  it('lets each open on its own with multiple', async () => {
    const el = await fixture<KtAccordion>(MARKUP('multiple'));
    const [shipping, returns] = sections(el);
    await open(shipping!);
    await open(returns!);
    expect(shipping!.open && returns!.open).toBe(true);
  });

  it('keeps the first of several opened in its markup, one at a time', async () => {
    const el = await fixture<KtAccordion>(`<kt-accordion>
      <kt-collapsible heading="A" open>a</kt-collapsible>
      <kt-collapsible heading="B" open>b</kt-collapsible>
    </kt-accordion>`);
    await settle(el);
    expect(sections(el).map((section) => section.open)).toEqual([true, false]);
  });

  it('says which section opened', async () => {
    const el = await fixture<KtAccordion>(MARKUP());
    const changed = vi.fn();
    el.addEventListener('kt-change', changed);
    await open(sections(el)[1]!);
    expect(changed.mock.calls.at(-1)![0].detail).toEqual({ open: [1] });
  });
});

describe('kt-collapsible focus', () => {
  it('puts the focus on its summary', async () => {
    const el = await fixture<KtCollapsible>('<kt-collapsible heading="x">y</kt-collapsible>');
    el.focus();
    expect(el.shadowRoot!.activeElement).toBe(el.shadowRoot!.querySelector('summary'));
  });
});
