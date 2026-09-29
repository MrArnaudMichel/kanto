/**
 * The bubble's size, which only a layout engine can measure.
 */
import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-tooltip.js';
import type { KtTooltip } from 'kanto-ds';

const bubble = (el: KtTooltip) => el.shadowRoot!.querySelector<HTMLElement>('.bubble')!;

describe('kt-tooltip, laid out', () => {
  it('keeps a short label on one line, as wide as its text', async () => {
    const el = await fixture<KtTooltip>('<kt-tooltip text="Clear"><button>x</button></kt-tooltip>');
    await settle(el);

    const box = bubble(el).getBoundingClientRect();
    expect(box.width).toBeLessThan(100);
    expect(box.height).toBeLessThan(40);
  });

  it('wraps a long message onto several lines instead of running past its width', async () => {
    const el = await fixture<KtTooltip>(
      `<kt-tooltip text="${'Enter the number without the leading 0, since the country code replaces it. '.repeat(2)}"><button>x</button></kt-tooltip>`,
    );
    await settle(el);

    const box = bubble(el).getBoundingClientRect();
    expect(box.width).toBeLessThanOrEqual(260);
    expect(box.height).toBeGreaterThan(40);
    expect(bubble(el).scrollWidth).toBeLessThanOrEqual(bubble(el).clientWidth);
  });
});
