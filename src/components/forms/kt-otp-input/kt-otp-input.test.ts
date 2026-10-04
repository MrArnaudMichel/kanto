import { describe, expect, it, vi } from 'vitest';
import { fixture, formFixture, settle } from '#test/fixture';
import './kt-otp-input.js';
import type { KtOtpInput } from 'kanto-ds';

const boxes = (el: KtOtpInput) => [...el.shadowRoot!.querySelectorAll('input')];

async function typeInto(el: KtOtpInput, index: number, text: string) {
  const box = boxes(el)[index]!;
  box.value = text;
  box.dispatchEvent(new InputEvent('input', { bubbles: true, data: text }));
  await settle(el);
}

function key(el: KtOtpInput, index: number, name: string) {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
  boxes(el)[index]!.dispatchEvent(event);
  return event;
}

describe('kt-otp-input', () => {
  it('is a named group of one box per character, each said as its place', async () => {
    const el = await fixture<KtOtpInput>('<kt-otp-input label="Verification code"></kt-otp-input>');
    const group = el.shadowRoot!.querySelector('[role="group"]')!;
    expect(group.getAttribute('aria-label')).toBe('Verification code');
    expect(boxes(el)).toHaveLength(6);
    expect(boxes(el)[0]!.getAttribute('aria-label')).toBe('Character 1 of 6');
    expect(boxes(el)[0]!.getAttribute('autocomplete')).toBe('one-time-code');
    expect(boxes(el)[0]!.getAttribute('inputmode')).toBe('numeric');
  });

  it('takes a length', async () => {
    const el = await fixture<KtOtpInput>('<kt-otp-input length="4"></kt-otp-input>');
    expect(boxes(el)).toHaveLength(4);
  });

  it('moves on as each character is typed, and says when it is whole', async () => {
    const el = await fixture<KtOtpInput>('<kt-otp-input length="4"></kt-otp-input>');
    const complete = vi.fn();
    el.addEventListener('kt-complete', complete);
    boxes(el)[0]!.focus();
    for (const [index, digit] of ['1', '2', '3', '4'].entries()) await typeInto(el, index, digit);
    expect(el.value).toBe('1234');
    expect(complete).toHaveBeenCalledOnce();
    expect(complete.mock.calls[0]![0].detail).toEqual({ value: '1234' });
  });

  it('refuses what is not a digit, unless told any character will do', async () => {
    const el = await fixture<KtOtpInput>('<kt-otp-input length="4"></kt-otp-input>');
    await typeInto(el, 0, 'a');
    expect(el.value).toBe('');
    expect(boxes(el)[0]!.value).toBe('');
    const any = await fixture<KtOtpInput>(
      '<kt-otp-input length="4" type="alphanumeric"></kt-otp-input>',
    );
    await typeInto(any, 0, 'a');
    expect(any.value).toBe('A');
  });

  it('spreads a pasted code over the boxes', async () => {
    const el = await fixture<KtOtpInput>('<kt-otp-input></kt-otp-input>');
    const complete = vi.fn();
    el.addEventListener('kt-complete', complete);
    const paste = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(paste, 'clipboardData', { value: { getData: () => ' 482 913 ' } });
    boxes(el)[0]!.dispatchEvent(paste);
    await settle(el);
    expect(el.value).toBe('482913');
    expect(
      boxes(el)
        .map((box) => box.value)
        .join(''),
    ).toBe('482913');
    expect(complete).toHaveBeenCalledOnce();
  });

  it('steps back on Backspace from an empty box, clearing the one before', async () => {
    const el = await fixture<KtOtpInput>('<kt-otp-input length="4" value="12"></kt-otp-input>');
    const event = key(el, 2, 'Backspace');
    await settle(el);
    expect(event.defaultPrevented).toBe(true);
    expect(el.value).toBe('1');
  });

  it('is a form control: its value submitted, required until whole, reset to its first value', async () => {
    const { element, internals } = await formFixture<KtOtpInput>(
      '<kt-otp-input name="code" length="4" value="12" required></kt-otp-input>',
    );
    expect(internals.setFormValue).toHaveBeenLastCalledWith('12');
    expect(internals.setValidity).toHaveBeenLastCalledWith(
      expect.objectContaining({ valueMissing: true }),
      'Enter the whole code.',
      expect.anything(),
    );
    await typeInto(element, 2, '3');
    await typeInto(element, 3, '4');
    expect(internals.setFormValue).toHaveBeenLastCalledWith('1234');
    expect(internals.setValidity).toHaveBeenLastCalledWith({});
    element.formResetCallback();
    await settle(element);
    expect(element.value).toBe('12');
  });

  it('says an error, and marks every box', async () => {
    const el = await fixture<KtOtpInput>(
      '<kt-otp-input error="That code has expired."></kt-otp-input>',
    );
    expect(boxes(el).every((box) => box.getAttribute('aria-invalid') === 'true')).toBe(true);
    expect(el.shadowRoot!.textContent).toContain('That code has expired.');
  });
});
