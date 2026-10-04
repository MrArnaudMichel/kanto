/** Quotes in columns when wide, one under another when narrow or single. */
import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import '../../../styles.css';
import './kt-testimonials.js';
import type { KtTestimonials } from 'kanto-ds';

async function mount(width: number, layout = 'grid') {
  const el = await fixture<KtTestimonials>(
    `<kt-testimonials layout="${layout}" style="width: ${width}px"></kt-testimonials>`,
  );
  el.testimonials = [1, 2, 3].map((n) => ({ quote: `Quote ${n}.`, name: `Person ${n}` }));
  await el.updateComplete;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return [...el.shadowRoot!.querySelectorAll('.list > li')].map((li) => li.getBoundingClientRect());
}

describe('kt-testimonials, laid out', () => {
  it('sets the quotes in columns when wide', async () => {
    const [a, b] = await mount(1000);
    expect(b!.left).toBeGreaterThan(a!.right);
  });

  it('puts one under another when narrow, or single', async () => {
    const [a, b] = await mount(360);
    expect(b!.top).toBeGreaterThanOrEqual(a!.bottom);
    const [c, d] = await mount(1000, 'single');
    expect(d!.top).toBeGreaterThanOrEqual(c!.bottom);
  });
});
