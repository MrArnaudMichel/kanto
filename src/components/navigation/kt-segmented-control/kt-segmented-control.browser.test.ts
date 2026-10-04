/**
 * Segment labels, laid out: whether one wraps is a question of layout, which
 * only a real browser answers.
 */
import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-segmented-control.js';
import type { KtSegmentedControl } from 'kanto-ds';

/**
 * How many lines a segment's label runs to: one line box per fragment of its
 * text. Only the label's own text counts — the whitespace a template leaves
 * around it gets boxes of its own, which sit at slightly different heights
 * depending on the font that loaded, and read as extra lines on CI.
 */
function lines(option: HTMLElement): number {
  const walker = document.createTreeWalker(option, NodeFilter.SHOW_TEXT);
  let count = 0;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (!node.textContent?.trim()) continue;
    const range = document.createRange();
    range.selectNodeContents(node);
    count += range.getClientRects().length;
  }
  return count;
}

describe('kt-segmented-control, laid out', () => {
  it('keeps every label on one line in a container that shrinks to fit', async () => {
    // A column that aligns its children to the start sizes each to its content.
    const column = await fixture<HTMLDivElement>(
      '<div style="display: flex; flex-direction: column; align-items: flex-start"><kt-segmented-control label="Source"></kt-segmented-control></div>',
    );
    const el = column.querySelector<KtSegmentedControl>('kt-segmented-control')!;
    el.options = [
      { value: 'browser', label: 'Browser' },
      { value: 'server', label: 'Server' },
      { value: 'virtual', label: '5,000 rows' },
    ];
    await settle(el);

    for (const option of el.shadowRoot!.querySelectorAll<HTMLElement>('.option')) {
      expect(lines(option), option.textContent!.trim()).toBe(1);
    }
  });
});

const OPTIONS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function mount(orientation = 'horizontal'): Promise<KtSegmentedControl> {
  const el = await fixture<KtSegmentedControl>(
    `<kt-segmented-control label="Range" orientation="${orientation}"></kt-segmented-control>`,
  );
  el.options = OPTIONS;
  el.value = 'week';
  await settle(el);
  await frame();
  return el;
}

const thumb = (el: KtSegmentedControl) => el.shadowRoot!.querySelector<HTMLElement>('.thumb')!;
const option = (el: KtSegmentedControl, index: number) =>
  el.shadowRoot!.querySelectorAll('.option')[index]!;
const sliding = (el: KtSegmentedControl) =>
  thumb(el)
    .getAnimations()
    .filter((a) => a instanceof CSSTransition);

function expectOn(el: KtSegmentedControl, index: number): void {
  const a = thumb(el).getBoundingClientRect();
  const b = option(el, index).getBoundingClientRect();
  for (const side of ['left', 'top', 'width', 'height'] as const) {
    expect(Math.abs(a[side] - b[side])).toBeLessThanOrEqual(1);
  }
}

describe('kt-segmented-control thumb', () => {
  it('sits on the selected segment, still, when it first appears', async () => {
    const el = await mount();
    expectOn(el, 1);
    expect(sliding(el)).toHaveLength(0);
  });

  it('follows its segment growing — a font arriving — without sliding', async () => {
    const el = await mount();
    await wait(50);
    // The label widens in place, as when the brand font replaces the fallback.
    (option(el, 1) as HTMLElement).style.paddingInline = '40px';
    await frame();
    await frame();
    expect(sliding(el)).toHaveLength(0);
    expectOn(el, 1);
  });

  it('slides to the segment chosen next, across or down', async () => {
    for (const orientation of ['horizontal', 'vertical']) {
      const el = await mount(orientation);
      el.value = 'month';
      await settle(el);
      await frame();
      expect(sliding(el).length).toBeGreaterThan(0);
      await wait(400);
      expectOn(el, 2);
    }
  });

  it('is the only surface: the segment paints none of its own', async () => {
    const el = await mount();
    expect(getComputedStyle(option(el, 1)).backgroundColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('keeps the selected label above the thumb', async () => {
    const el = await mount();
    const selected = option(el, 1).getBoundingClientRect();
    const hit = el.shadowRoot!.elementFromPoint(
      selected.left + selected.width / 2,
      selected.top + selected.height / 2,
    );
    expect(hit?.closest('.option')).toBe(option(el, 1));
  });
});
