/** A code typed for real: the focus moves on by itself, and back with Backspace. */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture } from '#test/fixture';
import '../../../styles.css';
import './kt-otp-input.js';
import type { KtOtpInput } from 'kanto-ds';

describe('kt-otp-input, typed', () => {
  it('takes six digits in a row, moving on by itself, and steps back with Backspace', async () => {
    const el = await fixture<KtOtpInput>('<kt-otp-input label="Code"></kt-otp-input>');
    let whole = '';
    el.addEventListener(
      'kt-complete',
      (event) => (whole = (event as CustomEvent<{ value: string }>).detail.value),
    );
    await userEvent.click(el.shadowRoot!.querySelectorAll('input')[0]!);
    await userEvent.keyboard('482913');
    expect(el.value).toBe('482913');
    expect(whole).toBe('482913');

    await userEvent.keyboard('{Backspace}{Backspace}');
    expect(el.value).toBe('4829');
    const focused = el.shadowRoot!.activeElement as HTMLInputElement;
    expect([...el.shadowRoot!.querySelectorAll('input')].indexOf(focused)).toBe(4);
  });

  it('lines its boxes up in one row, each square', async () => {
    const el = await fixture<KtOtpInput>('<kt-otp-input></kt-otp-input>');
    const boxes = [...el.shadowRoot!.querySelectorAll('input')].map((box) =>
      box.getBoundingClientRect(),
    );
    expect(new Set(boxes.map((box) => Math.round(box.top))).size).toBe(1);
    for (const box of boxes) expect(Math.round(box.width)).toBe(Math.round(box.height));
  });
});
