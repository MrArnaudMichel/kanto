/** Enter in the field subscribes; inline, the field sits beside the words. */
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture } from '#test/fixture';
import '../../../styles.css';
import './kt-newsletter.js';
import type { KtNewsletter } from 'kanto-ds';

describe('kt-newsletter, in a browser', () => {
  it('subscribes on Enter in the field', async () => {
    const el = await fixture<KtNewsletter>('<kt-newsletter heading="Notes"></kt-newsletter>');
    const sent = vi.fn();
    el.addEventListener('kt-subscribe', (event) => sent((event as CustomEvent).detail.email));
    const input = el.shadowRoot!.querySelector('kt-input')!.shadowRoot!.querySelector('input')!;
    input.focus();
    await userEvent.keyboard('ada@northwind.com{Enter}');
    expect(sent).toHaveBeenCalledWith('ada@northwind.com');
    await vi.waitFor(() => expect(el.subscribed).toBe(true));
  });

  it('sets the field beside the words when inline and wide', async () => {
    const el = await fixture<KtNewsletter>(
      '<kt-newsletter heading="Notes, monthly" layout="inline" style="width: 1000px"></kt-newsletter>',
    );
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const box = (selector: string) =>
      el.shadowRoot!.querySelector(selector)!.getBoundingClientRect();
    expect(box('.tail').left).toBeGreaterThanOrEqual(box('.block-head').right);
  });
});
