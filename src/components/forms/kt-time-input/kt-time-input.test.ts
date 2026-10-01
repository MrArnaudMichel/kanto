import { describe, expect, it, vi } from 'vitest';
import { fixture, formFixture, settle } from '#test/fixture';
import './kt-time-input.js';
import type { KtTimeInput } from 'kanto-ds';

const segments = (el: KtTimeInput) => [
  ...el.shadowRoot!.querySelectorAll<HTMLElement>('[role="spinbutton"]'),
];
const segment = (el: KtTimeInput, label: string) =>
  segments(el).find((candidate) => candidate.getAttribute('aria-label') === label)!;
const labels = (el: KtTimeInput) => segments(el).map((s) => s.getAttribute('aria-label'));
const shown = (el: KtTimeInput) => segments(el).map((s) => s.textContent!.trim());
const active = (el: KtTimeInput) => el.shadowRoot!.activeElement as HTMLElement;

/** Presses keys on whichever segment has focus, as a person typing would. */
async function press(el: KtTimeInput, ...keys: string[]) {
  for (const key of keys) {
    active(el).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
    await settle(el);
  }
}

async function mount(attributes = '', locale = 'en-GB') {
  const el = await fixture<KtTimeInput>(
    `<kt-time-input locale="${locale}" ${attributes}></kt-time-input>`,
  );
  await settle(el);
  return el;
}

describe('kt-time-input', () => {
  it('shows hours and minutes on the clock the language reads', async () => {
    const british = await mount();
    expect(labels(british)).toEqual(['Hour', 'Minute']);
    expect(british.shadowRoot!.querySelector('.literal')!.textContent).toBe(':');

    const american = await mount('', 'en-US');
    expect(labels(american)).toEqual(['Hour', 'Minute', 'AM or PM']);
  });

  it('follows hour-cycle over the language', async () => {
    expect(labels(await mount('hour-cycle="h12"'))).toEqual(['Hour', 'Minute', 'AM or PM']);
    expect(labels(await mount('hour-cycle="h23"', 'en-US'))).toEqual(['Hour', 'Minute']);
  });

  it('adds seconds when asked', async () => {
    expect(labels(await mount('seconds'))).toEqual(['Hour', 'Minute', 'Second']);
  });

  it('shows what each empty segment wants', async () => {
    expect(shown(await mount())).toEqual(['--', '--']);
  });

  it('shows its 24-hour value, on a 12-hour clock too', async () => {
    expect(shown(await mount('value="14:05"'))).toEqual(['14', '05']);
    expect(shown(await mount('value="14:05"', 'en-US'))).toEqual(['02', '05', 'PM']);
    expect(shown(await mount('value="00:30"', 'en-US'))).toEqual(['12', '30', 'AM']);
    expect(shown(await mount('value="09:15:30" seconds'))).toEqual(['09', '15', '30']);
  });

  it('takes a time typed digit by digit, with one kt-change', async () => {
    const el = await mount();
    const changed = vi.fn();
    el.addEventListener('kt-change', changed);
    segments(el)[0]!.focus();

    await press(el, '1', '4');
    expect(active(el).getAttribute('aria-label')).toBe('Minute');
    await press(el, '3', '0');

    expect(el.value).toBe('14:30');
    expect(changed).toHaveBeenCalledOnce();
    expect(changed.mock.calls[0]![0].detail).toEqual({ value: '14:30' });
  });

  it('moves on from an hour no digit could follow', async () => {
    const el = await mount();
    segments(el)[0]!.focus();
    await press(el, '7');
    expect(active(el).getAttribute('aria-label')).toBe('Minute');
  });

  it('reads AM or PM from its first letter, and keeps the value on 24 hours', async () => {
    const el = await mount('', 'en-US');
    segments(el)[0]!.focus();
    await press(el, '0', '2', '3', '0');
    expect(el.value).toBeNull(); // morning or afternoon?
    await press(el, 'p');
    expect(el.value).toBe('14:30');

    segment(el, 'AM or PM').focus();
    await press(el, 'a');
    expect(el.value).toBe('02:30');
    await press(el, 'ArrowUp');
    expect(el.value).toBe('14:30');
  });

  it('reads 12 AM as midnight and 12 PM as noon', async () => {
    const el = await mount('value="12:00"', 'en-US');
    expect(shown(el)).toEqual(['12', '00', 'PM']);
    segment(el, 'AM or PM').focus();
    await press(el, 'a');
    expect(el.value).toBe('00:00');
  });

  it('writes out a one-digit segment when the focus leaves it', async () => {
    const el = await mount();
    segments(el)[0]!.focus();
    await press(el, '1', ':', '5');
    expect(el.value).toBeNull(); // 5 or 50-something?

    segments(el)[0]!.focus();
    await settle(el);
    expect(shown(el)).toEqual(['01', '05']);
    expect(el.value).toBe('01:05');
  });

  it('steps the minutes by step with the arrows', async () => {
    const el = await mount('value="09:07" step="15"');
    segment(el, 'Minute').focus();
    await press(el, 'ArrowUp');
    expect(el.value).toBe('09:15');
    await press(el, 'ArrowDown', 'ArrowDown');
    expect(el.value).toBe('09:45');
  });

  it('wraps the hours round the clock', async () => {
    const el = await mount('value="23:00"');
    segment(el, 'Hour').focus();
    await press(el, 'ArrowUp');
    expect(el.value).toBe('00:00');
  });

  it('submits seconds with seconds', async () => {
    const el = await mount('seconds');
    segments(el)[0]!.focus();
    await press(el, '0', '9', '1', '5', '3', '0');
    expect(el.value).toBe('09:15:30');
  });

  it('turns down a time outside min and max', async () => {
    const el = await mount('min="09:00" max="18:00"');
    segments(el)[0]!.focus();
    await press(el, '0', '8', '3', '0');

    expect(el.value).toBeNull();
    const group = el.shadowRoot!.querySelector('[role="group"]')!;
    expect(group.getAttribute('aria-invalid')).toBe('true');
    expect(
      el.shadowRoot!.getElementById(group.getAttribute('aria-describedby')!)!.textContent,
    ).toBe('This time is outside the times you can choose.');

    segment(el, 'Hour').focus();
    await press(el, '1', '0');
    expect(el.value).toBe('10:30');
  });

  it('refills its segments when the clock changes', async () => {
    const el = await mount('value="14:05"');
    el.hourCycle = 'h12';
    await settle(el);
    expect(shown(el)).toEqual(['02', '05', 'pm']);
    expect(el.value).toBe('14:05');
  });

  it('reads each segment out as a spinbutton with its range', async () => {
    const el = await mount('value="14:05"', 'en-US');
    const hour = segment(el, 'Hour');
    expect(hour.getAttribute('aria-valuemin')).toBe('1');
    expect(hour.getAttribute('aria-valuemax')).toBe('12');
    expect(hour.getAttribute('aria-valuenow')).toBe('2');
    expect(segment(el, 'AM or PM').getAttribute('inputmode')).toBe('text');
    expect(segment(el, 'AM or PM').getAttribute('aria-valuetext')).toBe('PM');
  });
});

describe('kt-time-input in a form', () => {
  it('submits its value, and nothing while incomplete', async () => {
    const { element, internals } = await formFixture<KtTimeInput>(
      '<kt-time-input name="at" locale="en-GB" value="14:05"></kt-time-input>',
    );
    expect(internals.setFormValue).toHaveBeenLastCalledWith('14:05');

    element.value = null;
    await settle(element);
    expect(internals.setFormValue).toHaveBeenLastCalledWith(null);
  });

  it('asks for a time while required', async () => {
    const { internals } = await formFixture<KtTimeInput>(
      '<kt-time-input name="at" locale="en-GB" required></kt-time-input>',
    );
    expect(internals.setValidity).toHaveBeenLastCalledWith(
      expect.objectContaining({ valueMissing: true }),
      'Enter a time.',
      undefined,
    );
  });

  it('goes back to the time it started with when its form resets', async () => {
    const el = await mount('value="14:05"');
    el.value = '16:00';
    await settle(el);
    el.formResetCallback();
    await settle(el);
    expect(el.value).toBe('14:05');
    expect(shown(el)).toEqual(['14', '05']);
  });
});
