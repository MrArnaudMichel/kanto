import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-chart.js';
import type { KtChart } from 'kanto-ds';

/** happy-dom has no layout, so the width the ResizeObserver would report is faked. */
async function sized(markup: string, width = 480): Promise<KtChart> {
  const el = await fixture<KtChart>(markup);
  (el as unknown as { box: { width: number; height: number } }).box = { width, height: el.height };
  el.requestUpdate();
  await settle(el);
  return el;
}

const paths = (el: KtChart) => [...el.shadowRoot!.querySelectorAll('path.line')];
const rows = (el: KtChart) => [...el.shadowRoot!.querySelectorAll('tbody tr')];

describe('kt-chart', () => {
  let el: KtChart;

  beforeEach(async () => {
    el = await sized('<kt-chart label="Revenue"></kt-chart>');
    el.labels = ['Jan', 'Feb', 'Mar', 'Apr'];
    el.series = [{ name: 'Revenue', values: [10, 30, 20, 40] }];
    await settle(el);
  });

  it('draws one line per series', () => {
    expect(paths(el)).toHaveLength(1);
  });

  it('gives a lone series the brand hue, since there is no identity to encode', () => {
    expect(paths(el)[0]!.getAttribute('stroke')).toBe('var(--color-primary-base)');
  });

  it('assigns the categorical order by position once there are several', async () => {
    el.series = [
      { name: 'Revenue', values: [10, 30] },
      { name: 'Orders', values: [5, 8] },
      { name: 'Refunds', values: [1, 2] },
    ];
    await settle(el);

    expect(paths(el).map((p) => p.getAttribute('stroke'))).toEqual([
      'var(--chart-series-1)',
      'var(--chart-series-2)',
      'var(--chart-series-3)',
    ]);
  });

  it('keeps a series on its own colour when a neighbour is removed', async () => {
    el.series = [
      { name: 'Revenue', values: [10, 30] },
      { name: 'Orders', values: [5, 8] },
    ];
    await settle(el);
    const orders = paths(el)[1]!.getAttribute('stroke');

    // Dropping the first series must not repaint the survivor by rank...
    el.series = [{ name: 'Orders', values: [5, 8], color: 'var(--chart-series-2)' }];
    await settle(el);
    expect(paths(el)[0]!.getAttribute('stroke')).toBe(orders);
  });

  it('shows a legend only from two series up', async () => {
    expect(el.shadowRoot!.querySelector('.legend')).toBeNull();

    el.series = [
      { name: 'Revenue', values: [10, 30] },
      { name: 'Orders', values: [5, 8] },
    ];
    await settle(el);
    expect(el.shadowRoot!.querySelectorAll('.legend-item')).toHaveLength(2);
  });

  it('always renders the data as a table, and points the plot at it', () => {
    const table = el.shadowRoot!.querySelector('.table')!;
    expect(rows(el)).toHaveLength(4);
    expect(rows(el)[1]!.textContent).toContain('Feb');
    expect(el.shadowRoot!.querySelector('svg')!.getAttribute('aria-describedby')).toBe(table.id);
  });

  it('formats the table and the tooltip with the given formatter', async () => {
    el.format = (n) => `$${n}`;
    await settle(el);
    expect(rows(el)[0]!.textContent).toContain('$10');
  });

  it('reports the hovered index and draws a crosshair', async () => {
    const seen: number[] = [];
    el.addEventListener('kt-point-hover', (e) =>
      seen.push((e as CustomEvent<{ index: number }>).detail.index),
    );

    const svg = el.shadowRoot!.querySelector('svg')!;
    const move = new PointerEvent('pointermove');
    Object.defineProperty(move, 'offsetX', { value: 480 });
    svg.dispatchEvent(move);
    await settle(el);

    expect(seen[0]).toBe(3);
    expect(el.shadowRoot!.querySelector('.crosshair')).not.toBeNull();
    expect(el.shadowRoot!.querySelector('.tooltip')!.textContent).toContain('Apr');

    svg.dispatchEvent(new PointerEvent('pointerleave'));
    await settle(el);
    expect(seen.at(-1)).toBe(-1);
    expect(el.shadowRoot!.querySelector('.tooltip')).toBeNull();
  });

  it('draws bars instead of a line when asked', async () => {
    el.type = 'bar';
    await settle(el);
    expect(paths(el)).toHaveLength(0);
    expect(el.shadowRoot!.querySelectorAll('rect')).toHaveLength(4);
  });

  it('fills the area under the line only for the area type', async () => {
    expect(el.shadowRoot!.querySelector('linearGradient')).not.toBeNull();

    el.type = 'line';
    await settle(el);
    expect(el.shadowRoot!.querySelector('linearGradient')).toBeNull();
  });

  it('draws straight segments unless smoothing is asked for', async () => {
    expect(paths(el)[0]!.getAttribute('d')).not.toContain('C');

    el.smooth = true;
    await settle(el);
    expect(paths(el)[0]!.getAttribute('d')).toContain('C');
  });

  it('survives a flat series without dividing by zero', async () => {
    el.series = [{ name: 'Flat', values: [5, 5, 5] }];
    await settle(el);
    expect(paths(el)[0]!.getAttribute('d')).not.toContain('NaN');
  });

  it('renders nothing but stays valid with no data', async () => {
    const empty = await sized('<kt-chart></kt-chart>');
    expect(() => empty.shadowRoot!.querySelector('svg')).not.toThrow();
    expect(paths(empty)).toHaveLength(0);
  });

  it('thins the axis labels rather than letting them collide', async () => {
    el.labels = Array.from({ length: 40 }, (_, i) => `Day ${i + 1}`);
    el.series = [{ name: 'Revenue', values: Array.from({ length: 40 }, (_, i) => i) }];
    await settle(el);

    const drawn = el.shadowRoot!.querySelectorAll('.axis-label').length;
    expect(drawn).toBeGreaterThan(2);
    expect(drawn).toBeLessThan(40);
  });
});

describe('the ResizeObserver contract', () => {
  it('is disconnected when the element goes away', async () => {
    const el = await sized('<kt-chart></kt-chart>');
    const observer = (el as unknown as { observer: ResizeObserver }).observer;
    const disconnect = vi.spyOn(observer, 'disconnect');

    el.remove();
    expect(disconnect).toHaveBeenCalled();
  });
});
