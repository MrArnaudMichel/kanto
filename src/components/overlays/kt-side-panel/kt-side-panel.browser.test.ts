/** The side panel, closed, in a real browser: what the keyboard and screen readers can reach. */
import { describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-side-panel.js';
import type { KtSidePanel } from 'kanto-ds';

describe('kt-side-panel, closed', () => {
  it('leaves nothing to reach: off screen is not out of the way', async () => {
    const el = await fixture<KtSidePanel>(
      '<kt-side-panel heading="Versions"><button>Inside</button></kt-side-panel>',
    );
    const inside = el.querySelector('button')!;
    expect(inside.checkVisibility()).toBe(false);

    el.open = true;
    await settle(el);
    expect(inside.checkVisibility()).toBe(true);

    el.open = false;
    await settle(el);
    // Once its slide out has run — however long a loaded machine takes to run it.
    await expect.poll(() => inside.checkVisibility(), { timeout: 2000 }).toBe(false);
  });
});

describe('kt-side-panel, open', () => {
  it("leaves room for a field's focus ring inside its scrolling body", async () => {
    await import('../../forms/kt-input/kt-input.js');
    const el = await fixture<KtSidePanel>(
      '<kt-side-panel heading="New customer" open><kt-input label="Name"></kt-input></kt-side-panel>',
    );
    await settle(el);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const body = el.shadowRoot!.querySelector('.body')!.getBoundingClientRect();
    const field = el.querySelector('kt-input')!.getBoundingClientRect();
    // The ring is drawn 2px outside the field: the scroller must not cut it.
    expect(field.left - body.left).toBeGreaterThanOrEqual(2);
    expect(body.right - field.right).toBeGreaterThanOrEqual(2);
  });

  it('comes in three widths, and never wider than the screen', async () => {
    await page.viewport(1280, 800);
    const widths: Record<string, number> = {};
    for (const size of ['', 'medium', 'large']) {
      const el = await fixture<KtSidePanel>(
        `<kt-side-panel open ${size ? `size="${size}"` : ''} heading="Stack"><p>Body</p></kt-side-panel>`,
      );
      await settle(el);
      widths[size || 'small'] = el
        .shadowRoot!.querySelector('dialog')!
        .getBoundingClientRect().width;
      el.open = false;
      await settle(el);
    }
    await page.viewport(390, 800);
    const narrow = await fixture<KtSidePanel>(
      '<kt-side-panel open size="large" heading="Stack"><p>Body</p></kt-side-panel>',
    );
    await settle(narrow);
    const onPhone = narrow.shadowRoot!.querySelector('dialog')!.getBoundingClientRect().width;
    await page.viewport(414, 896);
    expect(widths).toEqual({ small: 308, medium: 480, large: 720 });
    expect(onPhone).toBeLessThanOrEqual(390);
  });
});
