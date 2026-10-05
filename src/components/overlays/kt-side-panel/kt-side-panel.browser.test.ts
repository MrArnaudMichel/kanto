/** The side panel, closed, in a real browser: what the keyboard and screen readers can reach. */
import { describe, expect, it } from 'vitest';
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
    // Once its slide out has run.
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(inside.checkVisibility()).toBe(false);
  });
});
