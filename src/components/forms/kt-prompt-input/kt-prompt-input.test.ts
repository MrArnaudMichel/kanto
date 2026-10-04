import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-prompt-input.js';
import type { KtPromptInput } from 'kanto-ds';

const field = (el: KtPromptInput) => el.shadowRoot!.querySelector('textarea')!;
const send = (el: KtPromptInput) =>
  el.shadowRoot!.querySelector<HTMLElement & { disabled: boolean }>('kt-button')!;

async function type(el: KtPromptInput, text: string): Promise<void> {
  field(el).value = text;
  field(el).dispatchEvent(new Event('input'));
  await settle(el);
}

function press(el: KtPromptInput, init: KeyboardEventInit): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { bubbles: true, cancelable: true, ...init });
  field(el).dispatchEvent(event);
  return event;
}

describe('kt-prompt-input', () => {
  it('is a labelled field with a labelled send button', async () => {
    const el = await fixture<KtPromptInput>('<kt-prompt-input></kt-prompt-input>');
    expect(field(el).getAttribute('aria-label')).toBe('Message');
    expect(send(el).getAttribute('label')).toBe('Send');
    const named = await fixture<KtPromptInput>(
      '<kt-prompt-input label="Ask Northwind"></kt-prompt-input>',
    );
    expect(field(named).getAttribute('aria-label')).toBe('Ask Northwind');
  });

  it('follows what is typed, and says so', async () => {
    const el = await fixture<KtPromptInput>('<kt-prompt-input></kt-prompt-input>');
    const input = vi.fn();
    el.addEventListener('kt-input', input);
    await type(el, 'Hello');
    expect(el.value).toBe('Hello');
    expect(input.mock.calls[0]![0].detail).toEqual({ value: 'Hello' });
  });

  it('sends on Enter and empties the field; Shift+Enter is a new line', async () => {
    const el = await fixture<KtPromptInput>('<kt-prompt-input></kt-prompt-input>');
    const submitted = vi.fn();
    el.addEventListener('kt-submit', submitted);
    await type(el, 'Summarise this week');

    const newline = press(el, { key: 'Enter', shiftKey: true });
    expect(newline.defaultPrevented).toBe(false);
    expect(submitted).not.toHaveBeenCalled();

    const enter = press(el, { key: 'Enter' });
    expect(enter.defaultPrevented).toBe(true);
    expect(submitted.mock.calls[0]![0].detail.value).toBe('Summarise this week');
    await settle(el);
    expect(el.value).toBe('');
  });

  it('sends on Cmd or Ctrl+Enter alone when asked to', async () => {
    const el = await fixture<KtPromptInput>(
      '<kt-prompt-input submit-on="mod-enter"></kt-prompt-input>',
    );
    const submitted = vi.fn();
    el.addEventListener('kt-submit', submitted);
    await type(el, 'Draft a reply');
    press(el, { key: 'Enter' });
    expect(submitted).not.toHaveBeenCalled();
    press(el, { key: 'Enter', ctrlKey: true });
    expect(submitted).toHaveBeenCalledOnce();
  });

  it('sends nothing blank, and its button says so', async () => {
    const el = await fixture<KtPromptInput>('<kt-prompt-input></kt-prompt-input>');
    const submitted = vi.fn();
    el.addEventListener('kt-submit', submitted);
    expect(send(el).disabled).toBe(true);
    await type(el, '   ');
    press(el, { key: 'Enter' });
    expect(submitted).not.toHaveBeenCalled();
    await type(el, 'Hi');
    expect(send(el).disabled).toBe(false);
  });

  it('leaves Enter alone while an input method composes', async () => {
    const el = await fixture<KtPromptInput>('<kt-prompt-input></kt-prompt-input>');
    const submitted = vi.fn();
    el.addEventListener('kt-submit', submitted);
    await type(el, 'こんにちは');
    press(el, { key: 'Enter', isComposing: true });
    expect(submitted).not.toHaveBeenCalled();
  });

  it('waits for the sending it is handed: empties on success, keeps the text on failure', async () => {
    const el = await fixture<KtPromptInput>('<kt-prompt-input></kt-prompt-input>');
    let finish!: () => void;
    el.addEventListener(
      'kt-submit',
      (event) =>
        (event as CustomEvent<{ wait: (p: Promise<unknown>) => void }>).detail.wait(
          new Promise<void>((resolve) => (finish = resolve)),
        ),
      { once: true },
    );
    await type(el, 'First');
    press(el, { key: 'Enter' });
    await settle(el);
    expect(el.value).toBe('First');
    expect(field(el).readOnly).toBe(true);
    finish();
    await vi.waitFor(() => expect(el.value).toBe(''));
    expect(field(el).readOnly).toBe(false);

    el.addEventListener(
      'kt-submit',
      (event) =>
        (event as CustomEvent<{ wait: (p: Promise<unknown>) => void }>).detail.wait(
          Promise.reject(new Error('offline')),
        ),
      { once: true },
    );
    await type(el, 'Second');
    press(el, { key: 'Enter' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    await settle(el);
    expect(el.value).toBe('Second');
  });

  it('sends from its button too, and not at all when disabled', async () => {
    const el = await fixture<KtPromptInput>('<kt-prompt-input></kt-prompt-input>');
    const submitted = vi.fn();
    el.addEventListener('kt-submit', submitted);
    await type(el, 'From the button');
    send(el).click();
    expect(submitted).toHaveBeenCalledOnce();

    el.disabled = true;
    await type(el, 'Again');
    press(el, { key: 'Enter' });
    expect(submitted).toHaveBeenCalledOnce();
    expect(field(el).disabled).toBe(true);
  });

  it('has slots for attachments and actions', async () => {
    const el = await fixture<KtPromptInput>('<kt-prompt-input></kt-prompt-input>');
    const names = [...el.shadowRoot!.querySelectorAll('slot')].map((slot) => slot.name);
    expect(names).toEqual(expect.arrayContaining(['attachments', 'actions']));
  });
});
