/** The bar on a phone: the brand at the start, the actions and the menu at the end. */
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { fixture } from '#test/fixture';
import '../../../styles.css';
import './kt-header.js';
import type { KtHeader } from 'kanto-ds';

afterEach(() => page.viewport(414, 896));

describe('kt-header, collapsed', () => {
  it('keeps its actions and its menu at the end of the bar, the brand at the start', async () => {
    await page.viewport(390, 800);
    const el = await fixture<KtHeader>(`<kt-header>
      <a slot="brand" href="/">KANTO</a>
      <nav><a href="/docs">Docs</a></nav>
      <button slot="actions" style="width: 32px; height: 32px">A</button>
      <button slot="actions" style="width: 32px; height: 32px">B</button>
    </kt-header>`);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const bar = el.shadowRoot!.querySelector('.bar')!.getBoundingClientRect();
    const menu = el.shadowRoot!.querySelector('.menu-button')!.getBoundingClientRect();
    const actions = el.shadowRoot!.querySelector('.actions')!.getBoundingClientRect();
    const brand = el.querySelector('[slot="brand"]')!.getBoundingClientRect();
    const padding = parseFloat(
      getComputedStyle(el.shadowRoot!.querySelector('.bar')!).paddingRight,
    );
    // The menu ends the bar; the actions sit right before it; the brand opens it.
    expect(Math.abs(menu.right - (bar.right - padding))).toBeLessThan(1);
    expect(menu.left - actions.right).toBeLessThan(24);
    expect(brand.left - bar.left).toBeLessThanOrEqual(padding + 1);
    expect(actions.left - brand.right).toBeGreaterThan(100);
  });
});
