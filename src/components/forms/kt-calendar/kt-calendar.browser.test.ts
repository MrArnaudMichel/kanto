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

describe('kt-calendar, for real', () => {
  it('reaches a date decades away by typing its year', async () => {
    const el = await fixture<KtCalendar>(
      '<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>',
    );

    await userEvent.click($(el, '.title'));
    await settle(el);
    await userEvent.keyboard('1990');
    await settle(el);
    await userEvent.click($(el, '[data-key="1990-6"]'));
    await settle(el);
    await userEvent.click($(el, '[data-date="1990-06-12"]'));
    await settle(el);

    expect(el.value).toBe('1990-06-12');
  });

  it('opens on the chosen year, scrolled into view', async () => {
    const el = await fixture<KtCalendar>(
      '<kt-calendar locale="en-GB" value="1987-04-02"></kt-calendar>',
    );
    await userEvent.click($(el, '.title'));
    await settle(el);

    const list = $(el, '[role="listbox"]').getBoundingClientRect();
    const chosen = $(el, '[data-year="1987"]').getBoundingClientRect();
    expect(chosen.top).toBeGreaterThanOrEqual(list.top);
    expect(chosen.bottom).toBeLessThanOrEqual(list.bottom);
  });

  it('puts focus where the next key expects it, through every switch', async () => {
    const el = await fixture<KtCalendar>(
      '<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>',
    );

    await userEvent.click($(el, '.title'));
    await settle(el);
    expect((deepActive() as HTMLElement).dataset.year).toBe('2026');

    await userEvent.keyboard('{Tab}');
    expect((deepActive() as HTMLElement).dataset.key).toBe('2026-9');

    await userEvent.keyboard('{ArrowLeft}{Enter}');
    await settle(el);
    expect((deepActive() as HTMLElement).dataset.date).toBe('2026-08-25');

    await userEvent.click($(el, '.title'));
    await settle(el);
    await userEvent.keyboard('{Escape}');
    await settle(el);
    expect((deepActive() as HTMLElement).dataset.date).toBe('2026-08-25');
  });

  it('shows its title as a button before it is hovered', async () => {
    // A bare "September 2026" read as a heading: nothing said it opens a panel.
    const el = await fixture<KtCalendar>(
      '<kt-calendar locale="en-GB" value="2026-09-25"></kt-calendar>',
    );
    const title = $(el, '.title');
    const transparent = /rgba\(0, 0, 0, 0\)|transparent/;

    const resting = getComputedStyle(title).backgroundColor;
    expect(resting).not.toMatch(transparent);

    await userEvent.hover(title);
    expect(getComputedStyle(title).backgroundColor).not.toBe(resting);
  });
});
