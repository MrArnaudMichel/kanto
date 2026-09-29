/**
 * The bubble's size, which only a layout engine can measure.
 */
import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-tooltip.js';
import type { KtTooltip } from 'kanto-ds';

const bubble = (el: KtTooltip) => el.shadowRoot!.querySelector<HTMLElement>('.bubble')!;

/** Hovers the trigger, which is what puts the bubble on screen. */
async function show(el: KtTooltip): Promise<void> {
  el.dispatchEvent(new PointerEvent('pointerenter'));
  await settle(el);
}

describe('kt-tooltip, laid out', () => {
  it('keeps a short label on one line, as wide as its text', async () => {
    const el = await fixture<KtTooltip>('<kt-tooltip text="Clear"><button>x</button></kt-tooltip>');
    await show(el);

    const box = bubble(el).getBoundingClientRect();
    expect(box.width).toBeLessThan(100);
    expect(box.height).toBeLessThan(40);
  });

  it('wraps a long message onto several lines instead of running past its width', async () => {
    const el = await fixture<KtTooltip>(
      `<kt-tooltip text="${'Enter the number without the leading 0, since the country code replaces it. '.repeat(2)}"><button>x</button></kt-tooltip>`,
    );
    await show(el);

    const box = bubble(el).getBoundingClientRect();
    expect(box.width).toBeLessThanOrEqual(260);
    expect(box.height).toBeGreaterThan(40);
    expect(bubble(el).scrollWidth).toBeLessThanOrEqual(bubble(el).clientWidth);
  });

  it('takes no room while hidden, even at the edge of the page', async () => {
    // Where a header puts its last icon: flush against the right edge.
    const row = await fixture<HTMLDivElement>(
      '<div style="display: flex; justify-content: flex-end; padding-top: 40px"><kt-tooltip text="Notifications and alerts"><button>x</button></kt-tooltip></div>',
    );
    await settle(row.querySelector('kt-tooltip'));

    expect(document.documentElement.scrollWidth).toBe(window.innerWidth);
  });
});
