/**
 * The date input with a real keyboard: focus has to move from segment to
 * segment for typing a date in one go to work, which only a browser shows.
 */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-date-input.js';
import '../kt-input/kt-input.js';
import type { KtDateInput } from 'kanto-ds';

function deepActive(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

const segments = (el: KtDateInput) => [
  ...el.shadowRoot!.querySelectorAll<HTMLElement>('[role="spinbutton"]'),
];

describe('kt-date-input, for real', () => {
  it('takes a date typed in one go, the focus moving on by itself', async () => {
    const el = await fixture<KtDateInput>(
      '<kt-date-input locale="en-GB" label="Due"></kt-date-input>',
    );

    await userEvent.click(segments(el)[0]!);
    await userEvent.keyboard('25092026');
    await settle(el);

    expect(el.value).toBe('2026-09-25');
    expect(deepActive()).toBe(segments(el)[2]);
  });

  it('steps a segment with the arrows and leaves its text untouched by the browser', async () => {
    const el = await fixture<KtDateInput>(
      '<kt-date-input locale="en-GB" label="Due" value="2026-09-25"></kt-date-input>',
    );

    await userEvent.click(segments(el)[1]!);
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    await userEvent.keyboard('x'); // a letter has nowhere to go in a month
    await settle(el);

    expect(el.value).toBe('2026-11-25');
    expect(segments(el)[1]!.textContent!.trim()).toBe('11');
  });

  it('is as tall as a kt-input beside it, at every screen size', async () => {
    const row = await fixture<HTMLDivElement>(
      '<div><kt-date-input locale="en-GB" label="Due"></kt-date-input><kt-input label="Name"></kt-input></div>',
    );
    const height = (selector: string) =>
      row.querySelector(selector)!.shadowRoot!.querySelector('.field')!.getBoundingClientRect()
        .height;
    expect(height('kt-date-input')).toBe(height('kt-input'));
  });

  it('opens its calendar over the page with the calendar option', async () => {
    const el = await fixture<KtDateInput>(
      '<kt-date-input locale="en-GB" label="Due" calendar value="2026-09-25"></kt-date-input>',
    );

    await userEvent.click(el.shadowRoot!.querySelector('.trigger')!);
    await settle(el);
    const panel = el.shadowRoot!.querySelector<HTMLElement>('.panel')!;
    expect(panel.matches(':popover-open')).toBe(true);

    const calendar = el.shadowRoot!.querySelector('kt-calendar')!;
    await settle(calendar);
    await userEvent.click(calendar.shadowRoot!.querySelector('[data-date="2026-09-10"]')!);
    await settle(el);

    expect(el.value).toBe('2026-09-10');
    expect(panel.matches(':popover-open')).toBe(false);
  });
});
