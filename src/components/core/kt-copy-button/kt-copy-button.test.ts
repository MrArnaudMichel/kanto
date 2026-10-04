import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-copy-button.js';
import type { KtCopyButton } from 'kanto-ds';

const button = (el: KtCopyButton) => el.shadowRoot!.querySelector('kt-button')!;

function clipboard(write: (text: string) => Promise<void>) {
  const writeText = vi.fn(write);
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
  return writeText;
}

afterEach(() => vi.restoreAllMocks());

describe('kt-copy-button', () => {
  it('is a button that says Copy, with the copy icon', async () => {
    const el = await fixture<KtCopyButton>(
      '<kt-copy-button value="npm install kanto-ds"></kt-copy-button>',
    );
    expect(button(el).getAttribute('icon')).toBe('copy');
    expect(button(el).textContent!.trim()).toBe('Copy');
    expect(button(el).getAttribute('done-label')).toBe('Copied');
  });

  it('copies its value, and says so', async () => {
    const writeText = clipboard(() => Promise.resolve());
    const el = await fixture<KtCopyButton>(
      '<kt-copy-button value="npm install kanto-ds"></kt-copy-button>',
    );
    const copied = vi.fn();
    el.addEventListener('kt-copy', copied);
    button(el).shadowRoot!.querySelector('button')!.click();
    await vi.waitFor(() => expect(copied).toHaveBeenCalledOnce());
    expect(writeText).toHaveBeenCalledWith('npm install kanto-ds');
    expect(copied.mock.calls[0]![0].detail).toEqual({ value: 'npm install kanto-ds' });
  });

  it('says nothing was copied when the clipboard refuses', async () => {
    clipboard(() => Promise.reject(new Error('denied')));
    const el = await fixture<KtCopyButton>('<kt-copy-button value="x"></kt-copy-button>');
    const copied = vi.fn();
    el.addEventListener('kt-copy', copied);
    await el.copy().catch(() => undefined);
    expect(copied).not.toHaveBeenCalled();
  });

  it('can be the icon alone, still named', async () => {
    const el = await fixture<KtCopyButton>('<kt-copy-button icon-only value="x"></kt-copy-button>');
    expect(button(el).textContent!.trim()).toBe('');
    expect(button(el).getAttribute('label')).toBe('Copy');
  });

  it('takes its own words, variant and size', async () => {
    const el = await fixture<KtCopyButton>(
      '<kt-copy-button value="x" label="Copy the key" copied-label="Key copied" variant="primary" size="small"></kt-copy-button>',
    );
    await settle(el);
    expect(button(el).textContent!.trim()).toBe('Copy the key');
    expect(button(el).getAttribute('done-label')).toBe('Key copied');
    expect(button(el).getAttribute('variant')).toBe('primary');
    expect(button(el).getAttribute('size')).toBe('small');
  });
});
