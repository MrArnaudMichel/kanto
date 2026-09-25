/**
 * The calendar's quick month and year navigation, with real clicks and keys:
 * what matters is that focus lands where the next key press expects it.
 */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-calendar.js';
import type { KtCalendar } from 'kanto-ds';

function deepActive(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

const $ = (el: KtCalendar, selector: string) =>
  el.shadowRoot!.querySelector<HTMLElement>(selector)!;
const $$ = (el: KtCalendar, selector: string) => [
  ...el.shadowRoot!.querySelectorAll<HTMLElement>(selector),
];

describe('kt-calendar, for real', () => {
  it('reaches a date decades away in a handful of clicks', async () => {
    const el = await fixture<KtCalendar>(
      '<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>',
    );

    await userEvent.click($$(el, '.heading')[1]!); // the year
    await settle(el);
    for (let page = 0; page < 3; page += 1) {
      await userEvent.click($$(el, '.nav')[0]!); // twelve years back, three times
      await settle(el);
    }
    await userEvent.click($(el, '[data-key="1990"]'));
    await settle(el);
    await userEvent.click($(el, '[data-key="1990-6"]'));
    await settle(el);
    await userEvent.click($(el, '[data-date="1990-06-12"]'));
    await settle(el);

    expect(el.value).toBe('1990-06-12');
  });

  it('puts focus on the grid after each switch of view, so the arrows keep working', async () => {
    const el = await fixture<KtCalendar>(
      '<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>',
    );

    await userEvent.click($$(el, '.heading')[0]!); // the month grid
    await settle(el);
    expect((deepActive() as HTMLElement).dataset.key).toBe('2026-9');

    await userEvent.keyboard('{ArrowLeft}{Enter}');
    await settle(el);
    expect((deepActive() as HTMLElement).dataset.date).toBe('2026-08-25');

    await userEvent.click($$(el, '.heading')[1]!); // the year grid
    await settle(el);
    await userEvent.keyboard('{Escape}');
    await settle(el);
    expect((deepActive() as HTMLElement).dataset.date).toBe('2026-08-25');
  });
});
