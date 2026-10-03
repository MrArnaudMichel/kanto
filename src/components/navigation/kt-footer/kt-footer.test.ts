import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-footer.js';
import type { KtFooter, KtFooterColumn } from 'kanto-ds';

const COLUMNS: KtFooterColumn[] = [
  {
    heading: 'Product',
    links: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    heading: 'Company',
    links: [{ label: 'GitHub', href: 'https://github.com/acme', external: true }],
  },
];

async function mount(markup = '<kt-footer></kt-footer>'): Promise<KtFooter> {
  const el = await fixture<KtFooter>(markup);
  el.columns = COLUMNS;
  await settle(el);
  return el;
}

const root = (el: KtFooter) => el.shadowRoot!;

describe('kt-footer', () => {
  it('is the page’s contentinfo landmark, named when asked', async () => {
    const el = await mount('<kt-footer label="Site"></kt-footer>');
    const footer = root(el).querySelector('footer')!;
    expect(footer.getAttribute('role')).toBe('contentinfo');
    expect(footer.getAttribute('aria-label')).toBe('Site');
  });

  it('draws a column per entry: its heading, then its links', async () => {
    const el = await mount();
    const columns = [...root(el).querySelectorAll('[part="column"]')];
    expect(columns).toHaveLength(2);
    expect(columns[0]!.querySelector('h2')!.textContent!.trim()).toBe('Product');
    const links = [...columns[0]!.querySelectorAll('a')];
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/features', '/pricing']);
    expect(links.map((link) => link.textContent!.trim())).toEqual(['Features', 'Pricing']);
  });

  it('lists the columns as one navigation, named by the footer', async () => {
    const el = await mount('<kt-footer label="Site"></kt-footer>');
    const nav = root(el).querySelector('nav')!;
    expect(nav.getAttribute('aria-label')).toBe('Site');
    expect(nav.querySelectorAll('[part="column"]')).toHaveLength(2);
  });

  it('marks an external link with an icon a screen reader skips, and keeps the opener safe', async () => {
    const el = await mount();
    const link = root(el).querySelector('a[href^="https://"]')!;
    expect(link.getAttribute('rel')).toBe('noopener');
    const icon = link.querySelector('kt-icon')!;
    expect(icon.getAttribute('name')).toBe('external-link');
    expect(icon.closest('[aria-hidden="true"]') ?? icon.getAttribute('aria-hidden')).toBeTruthy();
  });

  it('takes the heading level a page needs', async () => {
    const el = await mount('<kt-footer heading-level="3"></kt-footer>');
    expect(root(el).querySelectorAll('h3')).toHaveLength(2);
    expect(root(el).querySelectorAll('h2')).toHaveLength(0);
  });

  it('has slots for the brand, a word under it, actions and the legal line', async () => {
    const el = await mount();
    const names = [...root(el).querySelectorAll('slot')].map((slot) => slot.name || 'default');
    for (const name of ['brand', 'default', 'actions', 'legal']) expect(names).toContain(name);
  });

  it('leaves out the legal row while nothing is in it', async () => {
    const el = await mount();
    expect(root(el).querySelector<HTMLElement>('[part="bottom"]')!.hidden).toBe(true);
    const legal = document.createElement('span');
    legal.slot = 'legal';
    legal.textContent = '© 2026 Acme';
    el.append(legal);
    await new Promise((resolve) => setTimeout(resolve, 0));
    await settle(el);
    expect(root(el).querySelector<HTMLElement>('[part="bottom"]')!.hidden).toBe(false);
  });

  it('reflects its variant and its border', async () => {
    const el = await mount('<kt-footer variant="simple"></kt-footer>');
    expect(el.getAttribute('variant')).toBe('simple');
    expect(el.hasAttribute('bordered')).toBe(true);
    el.bordered = false;
    await settle(el);
    expect(el.hasAttribute('bordered')).toBe(false);
  });

  it('draws nothing for the columns when it has none', async () => {
    const el = await fixture<KtFooter>('<kt-footer></kt-footer>');
    expect(root(el).querySelector('nav')).toBeNull();
  });
});
