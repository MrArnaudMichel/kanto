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

  it('drops below its trigger at the top of the page, where "top" has no room', async () => {
    const el = await fixture<KtTooltip>(
      '<kt-tooltip text="Notifications" style="position: fixed; top: 0; left: 200px"><button>x</button></kt-tooltip>',
    );
    await show(el);

    const box = bubble(el).getBoundingClientRect();
    expect(box.top).toBeGreaterThanOrEqual(el.getBoundingClientRect().bottom);
  });

  it('floats above a container that clips its overflow', async () => {
    const box = await fixture<HTMLDivElement>(
      '<div style="overflow: hidden; height: 40px; margin-top: 100px"><kt-tooltip text="Star"><button>x</button></kt-tooltip></div>',
    );
    const el = box.querySelector('kt-tooltip')!;
    await show(el);

    // In the top layer, which no ancestor's overflow can clip.
    expect(bubble(el).matches(':popover-open')).toBe(true);
    expect(bubble(el).getBoundingClientRect().bottom).toBeLessThanOrEqual(
      box.getBoundingClientRect().top,
    );
  });

  it('shows in the top layer while held open, with no pointer over it', async () => {
    const el = await fixture<KtTooltip>(
      '<kt-tooltip text="Enter an email." open><span>!</span></kt-tooltip>',
    );
    await settle(el);

    expect(bubble(el).matches(':popover-open')).toBe(true);
    expect(bubble(el).getBoundingClientRect().height).toBeGreaterThan(0);
  });
});
