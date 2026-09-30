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
