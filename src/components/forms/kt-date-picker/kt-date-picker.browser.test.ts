/**
 * The date picker driven by a real keyboard and mouse, where focus actually
 * moves — the part of the dialog pattern a simulated DOM cannot vouch for.
 */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-date-picker.js';
import type { KtDatePicker } from 'kanto-ds';

function deepActive(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

const trigger = (el: KtDatePicker) => el.shadowRoot!.querySelector('.trigger')!;
const input = (el: KtDatePicker) => el.shadowRoot!.querySelector('input')!;

describe('kt-date-picker, for real', () => {
  it('is operable from the keyboard alone, and hands focus back', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker locale="en-GB" value="2026-09-25" label="Due date"></kt-date-picker>',
    );

    // One tab stop: the text. Down opens the calendar on the chosen day.
    await userEvent.tab();
    expect(deepActive()).toBe(input(el));

    await userEvent.keyboard('{ArrowDown}');
    await settle(el);
    expect((deepActive() as HTMLElement).dataset.date).toBe('2026-09-25');

    await userEvent.keyboard('{ArrowRight}{ArrowRight}{Enter}');
    await settle(el);

    expect(el.value).toBe('2026-09-27');
    expect(deepActive()).toBe(input(el));
  });

  it('closes on Escape, focus back on the field', async () => {
    const el = await fixture<KtDatePicker>('<kt-date-picker locale="en-GB"></kt-date-picker>');

    await userEvent.click(trigger(el));
    await settle(el);
    await userEvent.keyboard('{Escape}');
    await settle(el);

    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
    expect(deepActive()).toBe(input(el));
  });

  it('takes a date typed into the field', async () => {
    const el = await fixture<KtDatePicker>('<kt-date-picker locale="en-GB"></kt-date-picker>');

    await userEvent.click(input(el));
    await userEvent.keyboard('3/10/2026{Enter}');
    await settle(el);

    expect(el.value).toBe('2026-10-03');
    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('closes when focus leaves it', async () => {
    const wrapper = await fixture<HTMLElement>(
      '<div><kt-date-picker locale="en-GB" value="2026-09-25"></kt-date-picker><button>Next field</button></div>',
    );
    const el = wrapper.querySelector('kt-date-picker')!;

    await userEvent.click(trigger(el));
    await settle(el);
    wrapper.querySelector('button')!.focus();
    await settle(el);

    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('chooses a period with two clicks on the calendar', async () => {
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker range locale="en-GB" value="2026-09-01/2026-09-02"></kt-date-picker>',
    );
    const day = (iso: string) =>
      el
        .shadowRoot!.querySelector('kt-calendar')!
        .shadowRoot!.querySelector(`[data-date="${iso}"]`)!;

    await userEvent.click(trigger(el));
    await settle(el);
    await userEvent.click(day('2026-09-08'));
    await settle(el);
    await userEvent.click(day('2026-09-15'));
    await settle(el);

    expect(el.value).toBe('2026-09-08/2026-09-15');
  });
});
