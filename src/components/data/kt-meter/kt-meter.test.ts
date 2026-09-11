import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-meter.js';
import type { KtMeter } from 'kanto';

const widths = (el: KtMeter) =>
  [...el.shadowRoot!.querySelectorAll<HTMLElement>('.segment')].map((s) => s.style.width);

describe('kt-meter', () => {
  it('fills a single value as a percentage', async () => {
    const el = await fixture<KtMeter>('<kt-meter label="Storage" value="3"></kt-meter>');
    expect(widths(el)).toEqual(['3%']);
  });

  it('clamps a value outside 0-100', async () => {
    const el = await fixture<KtMeter>('<kt-meter value="140"></kt-meter>');
    expect(widths(el)).toEqual(['100%']);
    el.value = -8;
    await settle(el);
    expect(widths(el)).toEqual(['0%']);
  });

  it('divides the bar by segment share of their own sum', async () => {
    const el = await fixture<KtMeter>('<kt-meter></kt-meter>');
    el.segments = [
      { label: 'Documents', value: 30 },
      { label: 'Photos', value: 10 },
    ];
    await settle(el);
    expect(widths(el)).toEqual(['75%', '25%']);
  });

  it('measures against max when there is one, leaving the rest empty', async () => {
    const el = await fixture<KtMeter>('<kt-meter max="100"></kt-meter>');
    el.segments = [
      { label: 'Documents', value: 30 },
      { label: 'Photos', value: 10 },
    ];
    await settle(el);
    expect(widths(el)).toEqual(['30%', '10%']);
  });

  it('takes palette slots in order, and an explicit colour over them', async () => {
    const el = await fixture<KtMeter>('<kt-meter></kt-meter>');
    el.segments = [
      { label: 'A', value: 1 },
      { label: 'B', value: 1, color: 'rebeccapurple' },
    ];
    await settle(el);
    const fills = [...el.shadowRoot!.querySelectorAll<HTMLElement>('.segment')].map(
      (s) => s.style.background,
    );
    expect(fills[0]).toContain('--chart-series-1');
    expect(fills[1]).toContain('rebeccapurple');
  });

  it('reports itself as a meter, not a progress bar', async () => {
    const el = await fixture<KtMeter>('<kt-meter max="200"></kt-meter>');
    el.segments = [{ label: 'A', value: 50 }];
    await settle(el);

    const base = el.shadowRoot!.querySelector('[role="meter"]')!;
    expect(base.getAttribute('aria-valuemax')).toBe('200');
    expect(base.getAttribute('aria-valuenow')).toBe('50');
  });

  it('only draws the legend when asked, and formats the values', async () => {
    const el = await fixture<KtMeter>('<kt-meter></kt-meter>');
    el.segments = [{ label: 'Documents', value: 16.14 }];
    await settle(el);
    expect(el.shadowRoot!.querySelector('.legend')).toBeNull();

    el.showLegend = true;
    el.format = (n) => `${n} GB`;
    await settle(el);
    expect(el.shadowRoot!.querySelector('.legend')!.textContent).toContain('16.14 GB');
  });
});
