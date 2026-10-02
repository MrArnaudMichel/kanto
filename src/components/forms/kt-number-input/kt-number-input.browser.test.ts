/** The number field with a real keyboard, beside a kt-input. */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-number-input.js';
import '../kt-input/kt-input.js';
import type { KtNumberInput } from 'kanto-ds';

describe('kt-number-input, for real', () => {
  it('takes a typed number, reads it on Enter and steps it on the arrows', async () => {
    const el = await fixture<KtNumberInput>(
      '<kt-number-input label="Seats" min="1" max="50" locale="en-US"></kt-number-input>',
    );
    await userEvent.click(el.shadowRoot!.querySelector('input')!);
    await userEvent.keyboard('12{Enter}{ArrowUp}{ArrowUp}');
    await settle(el);
    expect(el.value).toBe(14);
  });

  it('is as tall as a kt-input beside it', async () => {
    const row = await fixture<HTMLDivElement>(
      '<div><kt-number-input label="Seats"></kt-number-input><kt-input label="Name"></kt-input></div>',
    );
    const height = (selector: string) =>
      row.querySelector(selector)!.shadowRoot!.querySelector('.field')!.getBoundingClientRect()
        .height;
    expect(height('kt-number-input')).toBe(height('kt-input'));
  });
});
