import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import './kt-testimonials.js';
import type { KtTestimonials } from 'kanto-ds';

const root = (el: KtTestimonials) => el.shadowRoot!;

const QUOTES = [
  {
    quote: 'We closed the month in a day.',
    name: 'Ada Park',
    role: 'CFO, Northwind',
    avatar: '/ada.png',
  },
  { quote: 'Reminders I never have to write.', name: 'Sam Ortiz' },
];

async function wall(markup = '<kt-testimonials heading="What teams say"></kt-testimonials>') {
  const el = await fixture<KtTestimonials>(markup);
  el.testimonials = QUOTES;
  await el.updateComplete;
  return el;
}

const items = (el: KtTestimonials) => [...root(el).querySelectorAll('.list > li')];

describe('kt-testimonials', () => {
  it('is a section named by its heading', async () => {
    const el = await wall();
    const section = root(el).querySelector('section')!;
    const label = root(el).getElementById(section.getAttribute('aria-labelledby')!)!;
    expect(label.textContent!.trim()).toBe('What teams say');
  });

  it('draws each as a figure: a blockquote, and who said it in the caption', async () => {
    const el = await wall();
    expect(items(el)).toHaveLength(2);
    const figure = items(el)[0]!.querySelector('figure')!;
    expect(figure.querySelector('blockquote')!.textContent!.trim()).toBe(
      'We closed the month in a day.',
    );
    const caption = figure.querySelector('figcaption')!;
    expect(caption.querySelector('.name')!.textContent!.trim()).toBe('Ada Park');
    expect(caption.querySelector('.role')!.textContent!.trim()).toBe('CFO, Northwind');
  });

  it('shows an avatar with the photo, or the initials, hidden from assistive tech', async () => {
    const el = await wall();
    const [first, second] = items(el).map((item) => item.querySelector('kt-avatar')!);
    expect(first!.getAttribute('src')).toBe('/ada.png');
    expect(first!.getAttribute('aria-hidden')).toBe('true');
    expect(second!.getAttribute('name')).toBe('Sam Ortiz');
    expect(items(el)[1]!.querySelector('.role')).toBeNull();
  });

  it('lays them out as a grid by default, or one at a time large', async () => {
    const el = await wall();
    expect(el.getAttribute('layout')).toBe('grid');
    el.layout = 'single';
    await el.updateComplete;
    expect(el.getAttribute('layout')).toBe('single');
  });
});
