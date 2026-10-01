import { describe, expect, it, vi } from 'vitest';
import { fixture, formFixture, settle } from '#test/fixture';
import './kt-date-input.js';
import type { KtDateInput } from 'kanto-ds';

const segments = (el: KtDateInput) => [
  ...el.shadowRoot!.querySelectorAll<HTMLElement>('[role="spinbutton"]'),
];
const segment = (el: KtDateInput, label: string) =>
  segments(el).find((candidate) => candidate.getAttribute('aria-label') === label)!;
const active = (el: KtDateInput) => el.shadowRoot!.activeElement as HTMLElement;

/** Presses keys on whichever segment has focus, as a person typing would. */
async function press(el: KtDateInput, ...keys: string[]) {
  for (const key of keys) {
    active(el).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
    await settle(el);
  }
}

async function mount(attributes = '') {
  const el = await fixture<KtDateInput>(
    `<kt-date-input locale="en-GB" ${attributes}></kt-date-input>`,
  );
  await settle(el);
  return el;
}

describe('kt-date-input', () => {
  it('lays its segments out the way the language writes a date', async () => {
    const british = await mount();
    expect(segments(british).map((s) => s.getAttribute('aria-label'))).toEqual([
      'Day',
      'Month',
      'Year',
    ]);
    expect(british.shadowRoot!.querySelector('.literal')!.textContent).toBe('/');

    const american = await fixture<KtDateInput>('<kt-date-input locale="en-US"></kt-date-input>');
    expect(segments(american).map((s) => s.getAttribute('aria-label'))).toEqual([
      'Month',
      'Day',
      'Year',
    ]);
  });

  it('shows what each empty segment wants', async () => {
    const el = await mount();
    expect(segments(el).map((s) => s.textContent!.trim())).toEqual(['dd', 'mm', 'yyyy']);
  });

  it('shows its ISO value in the segments', async () => {
    const el = await mount('value="2026-09-05"');
    expect(segments(el).map((s) => s.textContent!.trim())).toEqual(['05', '09', '2026']);
  });

  it('takes a date typed digit by digit, moving on from segment to segment', async () => {
    const el = await mount();
    const changed = vi.fn();
    el.addEventListener('kt-change', changed);
    segments(el)[0]!.focus();

    await press(el, '2', '5');
    expect(active(el).getAttribute('aria-label')).toBe('Month');
    await press(el, '9'); // nothing but September can start with 9
    expect(active(el).getAttribute('aria-label')).toBe('Year');
    await press(el, '2', '0', '2', '6');

    expect(el.value).toBe('2026-09-25');
    expect(changed).toHaveBeenCalledOnce();
    expect(changed.mock.calls[0]![0].detail).toEqual({ value: '2026-09-25' });
  });

  it('writes out a two-digit year when the focus leaves it', async () => {
    const el = await mount();
    segments(el)[0]!.focus();
    await press(el, '0', '1', '0', '1', '9', '8');
    expect(el.value).toBeNull(); // 98 is not a year yet

    segments(el)[0]!.focus(); // the year loses the focus
    await settle(el);
    expect(el.value).toBe('1998-01-01');
  });

  it('steps a segment with the arrows, keeping a day within its month', async () => {
    const el = await mount('value="2026-02-28"');
    segment(el, 'Month').focus();
    await press(el, 'ArrowUp');
    expect(el.value).toBe('2026-03-28');

    segment(el, 'Month').focus();
    await press(el, 'ArrowDown');
    segment(el, 'Day').focus();
    await press(el, 'ArrowUp'); // February 2026 has 28 days: back to the 1st
    expect(el.value).toBe('2026-02-01');
  });

  it('moves between segments with the side arrows, and on a typed separator', async () => {
    const el = await mount();
    segments(el)[0]!.focus();
    await press(el, '1', '/');
    expect(active(el).getAttribute('aria-label')).toBe('Month');
    await press(el, 'ArrowLeft');
    expect(active(el).getAttribute('aria-label')).toBe('Day');
    await press(el, 'ArrowRight', 'ArrowRight');
    expect(active(el).getAttribute('aria-label')).toBe('Year');
  });

  it('erases with Backspace, then steps back to the segment before', async () => {
    const el = await mount('value="2026-09-25"');
    segment(el, 'Month').focus();

    await press(el, 'Backspace', 'Backspace');
    expect(segment(el, 'Month').textContent!.trim()).toBe('mm');
    expect(el.value).toBeNull();

    await press(el, 'Backspace');
    expect(active(el).getAttribute('aria-label')).toBe('Day');
  });

  it('flags a date that does not exist, with no value', async () => {
    const el = await mount();
    segments(el)[0]!.focus();
    await press(el, '3', '1', '0', '2', '2', '0', '2', '6');

    expect(el.value).toBeNull();
    const group = el.shadowRoot!.querySelector('[role="group"]')!;
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(
      el.shadowRoot!.getElementById(group.getAttribute('aria-describedby')!)!.textContent,
    ).toMatch(/^Enter a date like /);
  });

  it('turns down a date outside min and max', async () => {
    const el = await mount('min="2026-01-01"');
    segments(el)[0]!.focus();
    await press(el, '3', '1', '1', '2', '2', '0', '2', '5');

    expect(el.value).toBeNull();
    expect(el.shadowRoot!.querySelector('[role="group"]')!.getAttribute('aria-invalid')).toBe(
      'true',
    );
  });

  it('reads each segment out as a spinbutton with its value', async () => {
    const el = await mount('value="2026-09-25"');
    const month = segment(el, 'Month');
    expect(month.getAttribute('aria-valuenow')).toBe('9');
    expect(month.getAttribute('aria-valuemin')).toBe('1');
    expect(month.getAttribute('aria-valuemax')).toBe('12');
    expect(month.getAttribute('inputmode')).toBe('numeric');
  });

  it('takes no typing while disabled', async () => {
    const el = await mount('value="2026-09-25" disabled');
    expect(segments(el).every((s) => s.getAttribute('tabindex') === '-1')).toBe(true);
    expect(segments(el).every((s) => s.getAttribute('contenteditable') === 'false')).toBe(true);
  });

  describe('with a calendar', () => {
    const button = (el: KtDateInput) => el.shadowRoot!.querySelector<HTMLElement>('.trigger');

    it('has no calendar button unless asked for one', async () => {
      expect(button(await mount())).toBeNull();
      expect(button(await mount('calendar'))).not.toBeNull();
    });

    it('opens a calendar on its value, and fills in the day chosen', async () => {
      const el = await mount('calendar value="2026-09-25"');
      const changed = vi.fn();
      el.addEventListener('kt-change', changed);

      button(el)!.click();
      await settle(el);
      const calendar = el.shadowRoot!.querySelector('kt-calendar')!;
      expect(calendar.value).toBe('2026-09-25');

      calendar.dispatchEvent(
        new CustomEvent('kt-change', {
          detail: { value: '2026-09-10' },
          bubbles: true,
          composed: true,
        }),
      );
      await settle(el);

      expect(el.value).toBe('2026-09-10');
      expect(segments(el).map((s) => s.textContent!.trim())).toEqual(['10', '09', '2026']);
      expect(button(el)!.getAttribute('aria-expanded')).toBe('false');
      expect(changed).toHaveBeenCalledOnce();
    });
  });
});

describe('kt-date-input in a form', () => {
  it('submits its ISO value, and nothing while incomplete', async () => {
    const { element, internals } = await formFixture<KtDateInput>(
      '<kt-date-input name="due" locale="en-GB" value="2026-09-25"></kt-date-input>',
    );
    expect(internals.setFormValue).toHaveBeenLastCalledWith('2026-09-25');

    element.value = null;
    await settle(element);
    expect(internals.setFormValue).toHaveBeenLastCalledWith(null);
  });

  it('asks for a date while required', async () => {
    const { internals } = await formFixture<KtDateInput>(
      '<kt-date-input name="due" locale="en-GB" required></kt-date-input>',
    );
    expect(internals.setValidity).toHaveBeenLastCalledWith(
      expect.objectContaining({ valueMissing: true }),
      'Select a date.',
      undefined,
    );
  });

  it('goes back to the date it started with when its form resets', async () => {
    const el = await mount('value="2026-09-25"');
    el.value = '2027-01-01';
    await settle(el);
    el.formResetCallback();
    await settle(el);
    expect(el.value).toBe('2026-09-25');
    expect(segments(el).map((s) => s.textContent!.trim())).toEqual(['25', '09', '2026']);
  });
});
