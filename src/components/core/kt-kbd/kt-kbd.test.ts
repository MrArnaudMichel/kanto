import { describe, expect, it } from 'vitest';
import { fixture } from 'kanto-ds/test/fixture';
import './kt-kbd.js';
import type { KtKbd } from 'kanto-ds';

const keys = (el: KtKbd) =>
  [...el.shadowRoot!.querySelectorAll('kbd')].map((k) => k.textContent!.trim());

describe('kt-kbd', () => {
  it('renders Mac symbols on a Mac', async () => {
    const el = await fixture<KtKbd>('<kt-kbd keys="mod k" platform="mac"></kt-kbd>');
    expect(keys(el)).toEqual(['⌘', 'K']);
  });

  it('renders words elsewhere', async () => {
    const el = await fixture<KtKbd>('<kt-kbd keys="mod k" platform="other"></kt-kbd>');
    expect(keys(el)).toEqual(['Ctrl', 'K']);
  });

  it('keeps meta honest — on Windows it really is the Windows key', async () => {
    const el = await fixture<KtKbd>('<kt-kbd keys="meta k" platform="other"></kt-kbd>');
    expect(keys(el)).toEqual(['Win', 'K']);
  });

  it('translates the modifiers it knows and passes the rest through', async () => {
    const el = await fixture<KtKbd>('<kt-kbd keys="ctrl shift escape p" platform="mac"></kt-kbd>');
    expect(el.labels).toEqual(['⌃', '⇧', 'esc', 'P']);
  });

  it('falls back to slotted content with no keys', async () => {
    const el = await fixture<KtKbd>('<kt-kbd>/</kt-kbd>');
    expect(el.shadowRoot!.querySelector('kbd slot')).not.toBeNull();
  });
});
