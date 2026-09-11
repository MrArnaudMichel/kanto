import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-code.js';
import type { KtCode } from 'kanto-ds';

const header = (el: KtCode) => el.shadowRoot!.querySelector('.header');
const copyButton = (el: KtCode) => el.shadowRoot!.querySelector<HTMLButtonElement>('.copy');
const language = (el: KtCode) => el.shadowRoot!.querySelector('.language')?.textContent?.trim();

describe('kt-code', () => {
  it('renders the slotted code inside a pre/code pair', async () => {
    const el = await fixture<KtCode>('<kt-code>const a = 1;</kt-code>');
    expect(el.shadowRoot!.querySelector('pre code slot')).not.toBeNull();
    expect(el.code).toBe('const a = 1;');
  });

  it('shows no header when there is nothing to put in it', async () => {
    const el = await fixture<KtCode>('<kt-code>const a = 1;</kt-code>');
    expect(header(el)).toBeNull();
  });

  it('shows the language, uppercased by CSS not by content', async () => {
    const el = await fixture<KtCode>('<kt-code language="js">const a = 1;</kt-code>');
    expect(language(el)).toBe('js');
    expect(header(el)).not.toBeNull();
  });

  it('offers no copy button unless asked', async () => {
    const el = await fixture<KtCode>('<kt-code language="js">const a = 1;</kt-code>');
    expect(copyButton(el)).toBeNull();

    el.copy = true;
    await settle(el);
    expect(copyButton(el)).not.toBeNull();
  });

  it('copies the text and confirms, then goes back', async () => {
    vi.useFakeTimers();
    try {
      const writeText = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

      const el = await fixture<KtCode>('<kt-code language="js" copy>const a = 1;</kt-code>');
      const copied = vi.fn();
      el.addEventListener('kt-copy', copied);

      copyButton(el)!.click();
      await vi.waitFor(() => expect(writeText).toHaveBeenCalledWith('const a = 1;'));
      await el.updateComplete;

      expect(copyButton(el)!.textContent).toContain('Copied');
      expect(copied.mock.calls[0]![0].detail.code).toBe('const a = 1;');

      vi.advanceTimersByTime(2000);
      await el.updateComplete;
      expect(copyButton(el)!.textContent).toContain('Copy');
    } finally {
      vi.unstubAllGlobals();
      vi.useRealTimers();
    }
  });

  it('survives a clipboard that refuses', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    const el = await fixture<KtCode>('<kt-code copy>const a = 1;</kt-code>');
    expect(() => copyButton(el)!.click()).not.toThrow();
    await el.updateComplete;

    vi.unstubAllGlobals();
  });

  it('strips the leading and trailing newlines a template literal leaves behind', async () => {
    const el = await fixture<KtCode>('<kt-code>\n\nconst a = 1;\n\n</kt-code>');
    expect(el.code).toBe('const a = 1;');
  });

  it('keeps the block reachable by keyboard, since it can scroll', async () => {
    const el = await fixture<KtCode>('<kt-code>const a = 1;</kt-code>');
    expect(el.shadowRoot!.querySelector('pre')!.getAttribute('tabindex')).toBe('0');
  });
});
