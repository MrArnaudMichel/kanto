import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixture, formFixture, settle } from '#test/fixture';
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

  it('cannot be operated from the keyboard while disabled', async () => {
    el.disabled = true;
    await settle(el);

    expect(segments(el).every((segment) => segment.disabled)).toBe(true);

    key(el, 'ArrowRight');
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

describe('kt-segmented-control in a form', () => {
  it('is a form-associated element', () => {
    expect(customElements.get('kt-segmented-control')).toHaveProperty('formAssociated', true);
  });

  it('submits the chosen value, and nothing while empty', async () => {
    const { element, internals } = await formFixture<KtSegmentedControl>(
      '<kt-segmented-control name="range"></kt-segmented-control>',
    );
    element.options = OPTIONS;
    await settle(element);
    expect(internals.setFormValue).toHaveBeenLastCalledWith(null);

    segments(element)[2]!.click();
    await settle(element);
    expect(internals.setFormValue).toHaveBeenLastCalledWith('month');
  });

  it('reports a missing value while required', async () => {
    const { element, internals } = await formFixture<KtSegmentedControl>(
      '<kt-segmented-control required></kt-segmented-control>',
    );
    expect(internals.setValidity).toHaveBeenLastCalledWith(
      { valueMissing: true },
      'Select an option.',
      undefined,
    );

    element.value = 'day';
    await settle(element);
    expect(internals.setValidity).toHaveBeenLastCalledWith({});
  });

  it('restores its initial value on form reset', async () => {
    const el = await fixture<KtSegmentedControl>(
      '<kt-segmented-control value="month"></kt-segmented-control>',
    );
    el.options = OPTIONS;
    el.value = 'day';
    await settle(el);

    el.formResetCallback();
    await settle(el);

    expect(el.value).toBe('month');
  });

  it('takes the value the browser restores', async () => {
    const el = await fixture<KtSegmentedControl>('<kt-segmented-control></kt-segmented-control>');
    el.formStateRestoreCallback('day');
    expect(el.value).toBe('day');
  });
});
