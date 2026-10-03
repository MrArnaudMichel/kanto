/**
 * The footer lays itself out from its own width: side by side when wide,
 * stacked when narrow, whatever the viewport.
 */
import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-footer.js';
import type { KtFooter } from 'kanto-ds';

async function mount(width: number, variant = 'columns'): Promise<KtFooter> {
  const el = await fixture<KtFooter>(
    `<kt-footer variant="${variant}" style="width: ${width}px"><a slot="brand" href="/">ACME</a>Invoicing for small teams.<span slot="legal">© 2026 Acme</span></kt-footer>`,
  );
  el.columns = [
    { heading: 'Product', links: [{ label: 'Pricing', href: '/pricing' }] },
    { heading: 'Company', links: [{ label: 'About', href: '/about' }] },
    { heading: 'Help', links: [{ label: 'Docs', href: '/docs' }] },
  ];
  await settle(el);
  return el;
}

const box = (el: KtFooter, part: string) =>
  el.shadowRoot!.querySelector(`[part="${part}"]`)!.getBoundingClientRect();

describe('kt-footer layout', () => {
  it('sets the brand beside the columns when wide', async () => {
    const el = await mount(1100);
    expect(box(el, 'columns').left).toBeGreaterThan(box(el, 'brand').right);
    expect(Math.abs(box(el, 'columns').top - box(el, 'brand').top)).toBeLessThan(2);
  });

  it('stacks them when narrow, inside the page', async () => {
    const el = await mount(360);
    expect(box(el, 'columns').top).toBeGreaterThan(box(el, 'brand').bottom);
    expect(el.shadowRoot!.querySelector('footer')!.scrollWidth).toBeLessThanOrEqual(360);
  });

  it('runs the links of the simple variant along one row', async () => {
    const el = await mount(1100, 'simple');
    const links = [...el.shadowRoot!.querySelectorAll('a')].map((a) => a.getBoundingClientRect());
    expect(new Set(links.map((rect) => Math.round(rect.top))).size).toBe(1);
    expect(el.shadowRoot!.querySelector<HTMLElement>('.heading')!.offsetParent).toBeNull();
  });

  it('lines up with the page when its side padding is zero', async () => {
    const el = await mount(1100);
    el.style.setProperty('--kt-footer-padding-inline', '0px');
    expect(Math.abs(box(el, 'brand').left - el.getBoundingClientRect().left)).toBeLessThan(1);
  });
});
