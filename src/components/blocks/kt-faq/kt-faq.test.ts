import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import './kt-faq.js';
import type { KtFaq } from 'kanto-ds';

const root = (el: KtFaq) => el.shadowRoot!;

const ITEMS = [
  { question: 'Can I cancel any time?', answer: 'Yes, from Settings. You keep your invoices.' },
  { question: 'Do you take card payments?', answer: 'Cards, bank transfers and direct debits.' },
];

async function faq(markup = '<kt-faq heading="Questions"></kt-faq>') {
  const el = await fixture<KtFaq>(markup);
  el.items = ITEMS;
  await el.updateComplete;
  return el;
}

describe('kt-faq', () => {
  it('is a section named by its heading', async () => {
    const el = await faq();
    const section = root(el).querySelector('section')!;
    const label = root(el).getElementById(section.getAttribute('aria-labelledby')!)!;
    expect(label.textContent!.trim()).toBe('Questions');
  });

  it('draws each question as a collapsible in an accordion, its answer inside', async () => {
    const el = await faq();
    const sections = root(el).querySelectorAll('kt-accordion > kt-collapsible');
    expect(sections).toHaveLength(2);
    expect(sections[0]!.getAttribute('heading')).toBe('Can I cancel any time?');
    expect(sections[0]!.textContent!.trim()).toBe('Yes, from Settings. You keep your invoices.');
  });

  it('opens one answer at a time unless multiple', async () => {
    const el = await faq();
    const accordion = root(el).querySelector('kt-accordion')!;
    expect(accordion.multiple).toBe(false);
    el.multiple = true;
    await el.updateComplete;
    expect(accordion.multiple).toBe(true);
  });

  it('opens the first answer with open-first', async () => {
    const el = await faq('<kt-faq open-first></kt-faq>');
    const [first, second] = root(el).querySelectorAll('kt-collapsible');
    expect(first!.hasAttribute('open')).toBe(true);
    expect(second!.hasAttribute('open')).toBe(false);
  });

  it('stacks its head over the questions, or splits them, and has a note slot', async () => {
    const el = await faq();
    expect(el.getAttribute('layout')).toBe('stacked');
    expect(root(el).querySelector('slot[name="note"]')).not.toBeNull();
  });
});
