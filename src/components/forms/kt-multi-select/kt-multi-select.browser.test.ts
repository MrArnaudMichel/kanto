/**
 * The chips on the field's one line, laid out: what fits depends on widths
 * only a real browser measures.
 */
import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-multi-select.js';
import type { KtMultiSelect } from 'kanto-ds';

const OPTIONS = Array.from({ length: 8 }, (_, index) => ({
  id: `r${index}`,
  label: `Region number ${index + 1}`,
}));

/** A render, a frame for layout and the resize observer, and the render that follows. */
async function frame(el: KtMultiSelect): Promise<void> {
  await settle(el);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await settle(el);
}

async function mount(width: number, count: number): Promise<KtMultiSelect> {
  const el = await fixture<KtMultiSelect>(
    `<kt-multi-select label="Regions" style="width: ${width}px"></kt-multi-select>`,
  );
  el.options = OPTIONS;
  el.value = OPTIONS.slice(0, count).map((option) => option.id);
  await frame(el);
  await frame(el);
  return el;
}

const control = (el: KtMultiSelect) => el.shadowRoot!.querySelector<HTMLElement>('.control')!;
const shownChips = (el: KtMultiSelect) =>
  [...el.shadowRoot!.querySelectorAll<HTMLElement>('.chip')].filter((chip) => !chip.hidden);
const more = (el: KtMultiSelect) => el.shadowRoot!.querySelector<HTMLElement>('.more');

describe('kt-multi-select, laid out', () => {
  it('shows every chip, and no count, when they fit', async () => {
    const el = await mount(900, 2);
    expect(shownChips(el)).toHaveLength(2);
    expect(more(el)).toBeNull();
  });

  it('keeps to one line, counting the chips that do not fit in "+N"', async () => {
    const el = await mount(360, 8);
    const shown = shownChips(el).length;
    const box = control(el).getBoundingClientRect();

    expect(shown).toBeGreaterThan(0);
    expect(shown).toBeLessThan(8);
    expect(more(el)!.textContent!.trim()).toBe(`+${8 - shown}`);
    // Nothing spills past the field, and the field stays one line high.
    for (const chip of shownChips(el)) {
      expect(chip.getBoundingClientRect().right).toBeLessThanOrEqual(box.right);
    }
    expect(box.height).toBeLessThan(60);
  });

  it('shows more chips once the field grows', async () => {
    const el = await mount(360, 8);
    const before = shownChips(el).length;

    el.style.width = '900px';
    await frame(el);
    await frame(el);
    expect(shownChips(el).length).toBeGreaterThan(before);
  });

  it('collapses chips chosen after it is on screen, not only those it starts with', async () => {
    // A filter bar: the field renders empty, and the choices arrive later.
    const el = await mount(260, 0);
    el.value = OPTIONS.slice(0, 5).map((option) => option.id);
    await frame(el);
    await frame(el);

    const box = control(el).getBoundingClientRect();
    expect(more(el)).not.toBeNull();
    for (const chip of shownChips(el)) {
      expect(chip.getBoundingClientRect().right).toBeLessThanOrEqual(box.right);
    }
  });

  it('settles once chips are chosen, rather than measuring itself over and over', async () => {
    // Firefox froze on the docs preview, a 460px field holding the regions.
    // The room was read from the chip row, whose width depends on the chips
    // and on the "+N": each measure undid the last, in a microtask loop that
    // never let the page paint again.
    const el = await fixture<KtMultiSelect>(
      '<kt-multi-select label="Regions" style="width: 460px"></kt-multi-select>',
    );
    const proto = Object.getPrototypeOf(el) as { fitChips: () => void };
    const fit = proto.fitChips;
    let calls = 0;
    proto.fitChips = function (this: KtMultiSelect) {
      calls += 1;
      // A loop would never let the test go on: stop it, and let the count tell.
      if (calls <= 50) fit.call(this);
    };
    try {
      el.options = [
        { id: 'ne', label: 'North East' },
        { id: 'sw', label: 'South West' },
        { id: 'nw', label: 'North West' },
      ];
      el.value = ['ne', 'sw'];
      await frame(el);
      el.value = ['ne', 'sw', 'nw'];
      await frame(el);
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(calls).toBeLessThan(20);
    } finally {
      proto.fitChips = fit;
    }
  });
});
