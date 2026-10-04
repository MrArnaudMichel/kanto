/** The field grows with what is written, up to max-rows, then scrolls. */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-prompt-input.js';
import type { KtPromptInput } from 'kanto-ds';

const field = (el: KtPromptInput) => el.shadowRoot!.querySelector('textarea')!;

describe('kt-prompt-input, laid out', () => {
  it('starts one line tall, grows with each line, and scrolls past max-rows', async () => {
    const el = await fixture<KtPromptInput>(
      '<kt-prompt-input max-rows="4" style="width: 480px"></kt-prompt-input>',
    );
    const one = field(el).getBoundingClientRect().height;

    el.value = 'one\ntwo\nthree';
    await settle(el);
    const three = field(el).getBoundingClientRect().height;
    expect(three).toBeGreaterThan(one * 2);

    el.value = Array.from({ length: 12 }, (_, i) => `line ${i}`).join('\n');
    await settle(el);
    const capped = field(el).getBoundingClientRect().height;
    expect(capped).toBeLessThan(one * 5);
    expect(getComputedStyle(field(el)).overflowY).toBe('auto');

    el.value = '';
    await settle(el);
    expect(Math.abs(field(el).getBoundingClientRect().height - one)).toBeLessThan(1);
  });

  it('takes a typed line break with Shift+Enter, and sends with Enter', async () => {
    const el = await fixture<KtPromptInput>('<kt-prompt-input></kt-prompt-input>');
    let sent = '';
    el.addEventListener(
      'kt-submit',
      (event) => (sent = (event as CustomEvent<{ value: string }>).detail.value),
    );
    await userEvent.click(field(el));
    await userEvent.keyboard('first{Shift>}{Enter}{/Shift}second{Enter}');
    expect(sent).toBe('first\nsecond');
    expect(el.value).toBe('');
  });
});
