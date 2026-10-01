/**
 * The time input with a real keyboard: focus has to move from segment to
 * segment for typing a time in one go to work, which only a browser shows.
 */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-time-input.js';
import '../kt-input/kt-input.js';
import type { KtTimeInput } from 'kanto-ds';

const segments = (el: KtTimeInput) => [
  ...el.shadowRoot!.querySelectorAll<HTMLElement>('[role="spinbutton"]'),
];

describe('kt-time-input, for real', () => {
  it('takes a time typed in one go on a 24-hour clock', async () => {
    const el = await fixture<KtTimeInput>(
      '<kt-time-input locale="en-GB" label="Starts"></kt-time-input>',
    );
    await userEvent.click(segments(el)[0]!);
    await userEvent.keyboard('1430');
    await settle(el);
    expect(el.value).toBe('14:30');
  });

  it('takes a time typed in one go on a 12-hour clock, the period by its letter', async () => {
    const el = await fixture<KtTimeInput>(
      '<kt-time-input locale="en-US" label="Starts"></kt-time-input>',
    );
    await userEvent.click(segments(el)[0]!);
    await userEvent.keyboard('0230p');
    await settle(el);
    expect(el.value).toBe('14:30');
    expect(segments(el)[2]!.textContent!.trim()).toBe('PM');
  });

  it('is as tall as a kt-input beside it', async () => {
    const row = await fixture<HTMLDivElement>(
      '<div><kt-time-input locale="en-GB" label="Starts"></kt-time-input><kt-input label="Name"></kt-input></div>',
    );
    const height = (selector: string) =>
      row.querySelector(selector)!.shadowRoot!.querySelector('.field')!.getBoundingClientRect()
        .height;
    expect(height('kt-time-input')).toBe(height('kt-input'));
  });
});
