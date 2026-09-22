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
    expect(el.shadowRoot!.querySelectorAll('.bar')).toHaveLength(4);
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

describe('bars', () => {
  const bars = (el: KtChart) => [...el.shadowRoot!.querySelectorAll<SVGPathElement>('path.bar')];
  const numbers = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  /** The left edge of a bar: the smallest x among its path's coordinates. */
  const leftEdge = (bar: SVGPathElement) =>
    Math.min(
      ...numbers(bar.getAttribute('d')!.replace(/A[\d.]+,[\d.]+ 0 0 1 /g, '')).filter(
        (_, i) => i % 2 === 0,
      ),
    );
  const hover = async (el: KtChart, x: number, y = 100) => {
    const move = new PointerEvent('pointermove');
    Object.defineProperty(move, 'offsetX', { value: x });
    Object.defineProperty(move, 'offsetY', { value: y });
    el.shadowRoot!.querySelector('svg')!.dispatchEvent(move);
    await settle(el);
  };

  let el: KtChart;

  beforeEach(async () => {
    el = await sized('<kt-chart type="bar" label="Orders"></kt-chart>');
    el.labels = ['North East', 'South West', 'Midlands', 'North West'];
    el.series = [
      { name: 'This quarter', values: [42, 58, 36, 71] },
      { name: 'Last quarter', values: [38, 44, 41, 55] },
    ];
    await settle(el);
  });

  it('leaves space between groups, so regions do not fuse into a wall', () => {
    const edges = bars(el)
      .map(leftEdge)
      .sort((a, b) => a - b);
    const withinGroup = edges[1]! - edges[0]!;
    const acrossGroups = edges[2]! - edges[1]!;
    expect(acrossGroups).toBeGreaterThan(withinGroup * 1.5);
  });

  it('centres each category label under its group', () => {
    const anchors = [...el.shadowRoot!.querySelectorAll('.axis-label')].map((label) =>
      label.getAttribute('text-anchor'),
    );
    expect(anchors).toEqual(['middle', 'middle', 'middle', 'middle']);
  });

  it('keeps the baseline square and rounds only the tip', () => {
    expect(bars(el)[0]!.getAttribute('d')!.match(/A/g)).toHaveLength(2);
  });

  it('labels the value axis', () => {
    expect(el.shadowRoot!.querySelectorAll('.tick-label').length).toBeGreaterThanOrEqual(3);
  });

  it('shows a tooltip for a band', async () => {
    await hover(el, 470);
    expect(el.shadowRoot!.querySelector('.tooltip')!.textContent).toContain('North West');
  });

  it('opens the tooltip beside a tall bar rather than over it', async () => {
    await hover(el, 470);
    const tooltip = el.shadowRoot!.querySelector('.tooltip')!;
    expect(tooltip.classList.contains('below')).toBe(false);
    // The last band sits at the right edge, so beside means to its left.
    expect(tooltip.classList.contains('left')).toBe(true);
  });

  it('stacks into one bar per category, with a total in the tooltip', async () => {
    el.stacked = true;
    await settle(el);
    expect(new Set(bars(el).map((bar) => Math.round(leftEdge(bar)))).size).toBe(4);

    await hover(el, 470);
    expect(el.shadowRoot!.querySelector('.tooltip-total')!.textContent).toContain('126');
  });

  it('adds a total column to the table of a stack', async () => {
    el.stacked = true;
    await settle(el);
    const head = [...el.shadowRoot!.querySelectorAll('thead th')].map((th) =>
      th.textContent!.trim(),
    );
    expect(head.at(-1)).toBe('Total');
    expect(el.shadowRoot!.querySelectorAll('tbody tr')[3]!.textContent).toContain('126');
  });

  it('rounds only the outer end of a stack', async () => {
    el.stacked = true;
    await settle(el);
    const [bottom, top] = bars(el).filter((bar) => bar.dataset['index'] === '0');
    expect(bottom!.getAttribute('d')).not.toContain('A');
    expect(top!.getAttribute('d')).toContain('A');
  });

  it('lays bars on their side, with the categories down the left', async () => {
    el.horizontal = true;
    await settle(el);
    const anchors = [...el.shadowRoot!.querySelectorAll('.axis-label')].map((label) =>
      label.getAttribute('text-anchor'),
    );
    expect(anchors.every((anchor) => anchor === 'end')).toBe(true);
  });

  it('draws a line series over bars, each point above its bar', async () => {
    el.series = [
      { name: 'Orders', values: [42, 58, 36, 71] },
      { name: 'Target', values: [50, 50, 50, 50], type: 'line' },
    ];
    await settle(el);
    expect(bars(el)).toHaveLength(4);

    const line = el.shadowRoot!.querySelector('path.line')!;
    const firstX = numbers(line.getAttribute('d')!)[0]!;
    const bar = bars(el)[0]!;
    const xs = numbers(bar.getAttribute('d')!.replace(/A[\d.]+,[\d.]+ 0 0 1 /g, '')).filter(
      (_, i) => i % 2 === 0,
    );
    expect(firstX).toBeCloseTo((Math.min(...xs) + Math.max(...xs)) / 2, 0);
  });

  it('hangs a negative bar from a marked zero line', async () => {
    el.series = [{ name: 'Net', values: [20, -15, 10, -5] }];
    await settle(el);
    expect(el.shadowRoot!.querySelector('.baseline')).not.toBeNull();
    expect(el.shadowRoot!.querySelectorAll('path.bar.negative')).toHaveLength(2);
  });
});

describe('interaction', () => {
  let el: KtChart;
  const svg = () => el.shadowRoot!.querySelector('svg')!;
  const press = async (key: string) => {
    svg().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    await settle(el);
  };
  const lines = () => el.shadowRoot!.querySelectorAll('path.line');
  const legend = () => el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.legend-item');

  beforeEach(async () => {
    el = await sized('<kt-chart type="line" label="Traffic"></kt-chart>');
    el.labels = ['Mon', 'Tue', 'Wed'];
    el.series = [
      { name: 'Visits', values: [10, 20, 30] },
      { name: 'Signups', values: [1, 2, 3] },
    ];
    await settle(el);
  });

  it('is reachable by keyboard and walks the points with the arrows', async () => {
    expect(svg().getAttribute('tabindex')).toBe('0');

    const seen: number[] = [];
    el.addEventListener('kt-point-hover', (e) => seen.push((e as CustomEvent).detail.index));
    await press('ArrowRight');
    await press('ArrowRight');
    await press('End');
    await press('Home');
    await press('ArrowLeft');

    expect(seen).toEqual([0, 1, 2, 0]);
    expect(el.shadowRoot!.querySelector('.tooltip')!.textContent).toContain('Mon');
  });

  it('lets go of the point on Escape', async () => {
    await press('ArrowRight');
    await press('Escape');
    expect(el.shadowRoot!.querySelector('.tooltip')).toBeNull();
  });

  it('hides a series from its legend button, keeping the other colours', async () => {
    const signups = lines()[1]!.getAttribute('stroke');

    legend()[0]!.click();
    await settle(el);

    expect(legend()[0]!.getAttribute('aria-pressed')).toBe('false');
    expect(lines()).toHaveLength(1);
    expect(lines()[0]!.getAttribute('stroke')).toBe(signups);
  });

  it('brings a hidden series back on a second press', async () => {
    legend()[0]!.click();
    await settle(el);
    legend()[0]!.click();
    await settle(el);
    expect(lines()).toHaveLength(2);
  });

  it('reports the toggle, and lets the host veto it', async () => {
    const details: unknown[] = [];
    el.addEventListener('kt-series-toggle', (e) => {
      details.push((e as CustomEvent).detail);
      e.preventDefault();
    });

    legend()[1]!.click();
    await settle(el);

    expect(details).toEqual([{ series: 1, hidden: true }]);
    expect(lines()).toHaveLength(2);
  });

  it('forgets hidden series when new data arrives', async () => {
    legend()[0]!.click();
    await settle(el);

    el.series = [
      { name: 'A', values: [1, 2, 3] },
      { name: 'B', values: [3, 2, 1] },
    ];
    await settle(el);
    expect(lines()).toHaveLength(2);
  });

  it('shows no legend for a single series, which has nothing to tell apart', async () => {
    el.series = [{ name: 'Visits', values: [10, 20, 30] }];
    await settle(el);
    expect(legend()).toHaveLength(0);
  });
});

describe('scatter and bubble', () => {
  it('draws one dot per point and describes each in the table', async () => {
    const el = await sized('<kt-chart type="scatter" label="Height and weight"></kt-chart>');
    el.series = [
      {
        name: 'Group A',
        points: [
          { x: 160, y: 55 },
          { x: 172, y: 70 },
        ],
      },
      { name: 'Group B', points: [{ x: 180, y: 82, label: 'Tall' }] },
    ];
    await settle(el);

    expect(el.shadowRoot!.querySelectorAll('circle.dot')).toHaveLength(3);
    expect(el.shadowRoot!.querySelectorAll('tbody tr')).toHaveLength(3);
    expect(el.shadowRoot!.querySelector('tbody')!.textContent).toContain('Tall');
  });

  it('sizes bubbles by area', async () => {
    const el = await sized('<kt-chart type="bubble"></kt-chart>');
    el.series = [
      {
        name: 'Markets',
        points: [
          { x: 1, y: 1, r: 100 },
          { x: 2, y: 2, r: 25 },
        ],
      },
    ];
    await settle(el);

    const radii = [...el.shadowRoot!.querySelectorAll('circle.dot')]
      .map((circle) => Number(circle.getAttribute('r')))
      .sort((a, b) => b - a);
    expect(radii[0]! / radii[1]!).toBeCloseTo(2);
  });

  it('walks a series point by point in x order, and moves between series', async () => {
    const el = await sized('<kt-chart type="scatter"></kt-chart>');
    el.series = [
      {
        name: 'A',
        points: [
          { x: 9, y: 1, label: 'Right' },
          { x: 1, y: 1, label: 'Left' },
        ],
      },
      { name: 'B', points: [{ x: 5, y: 5, label: 'Middle' }] },
    ];
    await settle(el);
    const svg = el.shadowRoot!.querySelector('svg')!;
    const press = async (key: string) => {
      svg.dispatchEvent(new KeyboardEvent('keydown', { key }));
      await settle(el);
    };
    const tooltip = () => el.shadowRoot!.querySelector('.tooltip')!.textContent!;

    await press('ArrowRight');
    expect(tooltip()).toContain('Left');
    await press('ArrowRight');
    expect(tooltip()).toContain('Right');
    await press('ArrowDown');
    expect(tooltip()).toContain('Middle');
  });
});

describe('radial charts', () => {
  const slices = (el: KtChart) => el.shadowRoot!.querySelectorAll('path.slice');

  it('draws a pie with a legend of its slices, even for a single series', async () => {
    const el = await sized('<kt-chart type="pie" label="Traffic"></kt-chart>');
    el.labels = ['Direct', 'Search', 'Social'];
    el.series = [{ name: 'Visits', values: [412, 298, 120] }];
    await settle(el);

    expect(slices(el)).toHaveLength(3);
    expect(el.shadowRoot!.querySelectorAll('.legend-item')).toHaveLength(3);
    expect(el.shadowRoot!.querySelector('tbody')!.textContent).toContain('50%');
  });

  it('colours slices in the categorical order', async () => {
    const el = await sized('<kt-chart type="pie"></kt-chart>');
    el.labels = ['A', 'B'];
    el.series = [{ name: 'V', values: [1, 1] }];
    await settle(el);

    expect([...slices(el)].map((slice) => slice.getAttribute('fill'))).toEqual([
      'var(--chart-series-1)',
      'var(--chart-series-2)',
    ]);
  });

  it('hides a slice from the legend', async () => {
    const el = await sized('<kt-chart type="doughnut"></kt-chart>');
    el.labels = ['A', 'B', 'C'];
    el.series = [{ name: 'V', values: [1, 1, 1] }];
    await settle(el);

    el.shadowRoot!.querySelector<HTMLButtonElement>('.legend-item')!.click();
    await settle(el);
    expect(slices(el)).toHaveLength(2);
  });

  it('shows the total in the middle of a doughnut', async () => {
    const el = await sized('<kt-chart type="doughnut" center-label="Visits"></kt-chart>');
    el.labels = ['Direct', 'Search'];
    el.series = [{ name: 'Visits', values: [60, 40] }];
    el.format = (n) => `${n} visits`;
    await settle(el);

    expect(el.shadowRoot!.querySelector('.center-value')!.textContent).toBe('100 visits');
    expect(el.shadowRoot!.querySelector('.center-label')!.textContent).toBe('Visits');
  });

  it('draws polar slices with rings behind them', async () => {
    const el = await sized('<kt-chart type="polar-area"></kt-chart>');
    el.labels = ['A', 'B', 'C'];
    el.series = [{ name: 'V', values: [10, 20, 30] }];
    await settle(el);

    expect(slices(el)).toHaveLength(3);
    expect(el.shadowRoot!.querySelectorAll('circle.grid').length).toBeGreaterThan(0);
  });

  it('draws one outline per series on a radar, and a label per spoke', async () => {
    const el = await sized('<kt-chart type="radar"></kt-chart>');
    el.labels = ['Speed', 'Reliability', 'Comfort', 'Safety', 'Efficiency'];
    el.series = [
      { name: 'Model A', values: [65, 59, 90, 81, 56] },
      { name: 'Model B', values: [28, 48, 40, 19, 96] },
    ];
    await settle(el);

    expect(el.shadowRoot!.querySelectorAll('path.radar')).toHaveLength(2);
    expect(el.shadowRoot!.querySelectorAll('.axis-label')).toHaveLength(5);
    expect(el.shadowRoot!.querySelectorAll('.legend-item')).toHaveLength(2);
  });

  it('walks the slices with the keyboard, with the share in the tooltip', async () => {
    const el = await sized('<kt-chart type="pie"></kt-chart>');
    el.labels = ['A', 'B'];
    el.series = [{ name: 'V', values: [3, 1] }];
    await settle(el);

    el.shadowRoot!.querySelector('svg')!.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight' }),
    );
    await settle(el);

    const tooltip = el.shadowRoot!.querySelector('.tooltip')!.textContent!;
    expect(tooltip).toContain('A');
    expect(tooltip).toContain('75%');
  });
});
