/** Copied: the tick comes in, so the click reads as done. */
import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-code.js';
import type { KtCode } from 'kanto-ds';

describe('kt-code motion', () => {
  it('brings the tick in once the code is copied', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
    const el = await fixture<KtCode>('<kt-code copy code="npm i kanto-ds"></kt-code>');
    const icon = () => el.shadowRoot!.querySelector('.copy kt-icon')!;
    expect(
      icon()
        .getAnimations()
        .filter((a) => a.id === 'kt-code-copied'),
    ).toHaveLength(0);

    el.shadowRoot!.querySelector<HTMLButtonElement>('.copy')!.click();
    await vi.waitFor(() => expect(el.shadowRoot!.querySelector('.copied')).not.toBeNull());
    await settle(el);
    expect(
      icon()
        .getAnimations()
        .filter((a) => a.id === 'kt-code-copied'),
    ).toHaveLength(1);
    vi.restoreAllMocks();
  });
});
