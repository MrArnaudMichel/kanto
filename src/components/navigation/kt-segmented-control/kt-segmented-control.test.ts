import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixture, settle } from 'kanto-ds/test/fixture';
import './kt-segmented-control.js';
import type { KtSegmentedControl, KtSegmentedOption } from 'kanto-ds';

const OPTIONS: KtSegmentedOption[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week', disabled: true },
  { value: 'month', label: 'Month' },
];

const track = (el: KtSegmentedControl) => el.shadowRoot!.querySelector('.track')!;
const segments = (el: KtSegmentedControl) => [
  ...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.option'),
];
const key = (el: KtSegmentedControl, k: string) =>
  track(el).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('kt-segmented-control', () => {
  let el: KtSegmentedControl;

  beforeEach(async () => {
    el = await fixture<KtSegmentedControl>('<kt-segmented-control></kt-segmented-control>');
    el.options = OPTIONS;
    el.value = 'day';
    await settle(el);
  });

  it('is a radio group with one radio per option', () => {
    expect(track(el).getAttribute('role')).toBe('radiogroup');
    expect(segments(el).map((s) => s.getAttribute('role'))).toEqual(['radio', 'radio', 'radio']);
    expect(segments(el).map((s) => s.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
    ]);
  });

  it('keeps a single tab stop, on the selected segment', () => {
    expect(segments(el).map((s) => s.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
  });

  it('puts the tab stop on the first selectable segment when nothing is chosen', async () => {
    el.value = null;
    await settle(el);
    expect(segments(el)[0]!.getAttribute('tabindex')).toBe('0');
  });

  it('selects on click and reports it', async () => {
    const listener = vi.fn();
    el.addEventListener('kt-change', listener);

    segments(el)[2]!.click();
    await settle(el);

    expect(el.value).toBe('month');
    expect(listener.mock.calls[0]![0].detail.value).toBe('month');
  });

  it('ignores a disabled segment', async () => {
    segments(el)[1]!.click();
    await settle(el);
    expect(el.value).toBe('day');
  });

  it('moves and selects with the arrows, skipping disabled segments', async () => {
    key(el, 'ArrowRight');
    await settle(el);
    expect(el.value).toBe('month');

    key(el, 'ArrowRight');
    await settle(el);
    expect(el.value).toBe('day');

    key(el, 'ArrowLeft');
    await settle(el);
    expect(el.value).toBe('month');
  });

  it('uses the vertical arrows when the orientation is vertical', async () => {
    el.orientation = 'vertical';
    await settle(el);

    key(el, 'ArrowDown');
    await settle(el);
    expect(el.value).toBe('month');
    expect(track(el).getAttribute('aria-orientation')).toBe('vertical');
  });

  it('jumps to the ends with Home and End', async () => {
    key(el, 'End');
    await settle(el);
    expect(el.value).toBe('month');

    key(el, 'Home');
    await settle(el);
    expect(el.value).toBe('day');
  });

  it('fires nothing when the active segment is re-selected', async () => {
    const listener = vi.fn();
    el.addEventListener('kt-change', listener);

    segments(el)[0]!.click();
    await settle(el);

    expect(listener).not.toHaveBeenCalled();
  });
});
