import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-pagination.js';
import type { KtPagination } from 'kanto';

/** The two controls are <kt-button>s, so reach through to their own buttons. */
const buttons = (el: KtPagination) =>
  [...el.shadowRoot!.querySelectorAll('kt-button')].map((b) =>
    b.shadowRoot!.querySelector('button')!,
  );

const controls = (el: KtPagination) => [...el.shadowRoot!.querySelectorAll('kt-button')];
const info = (el: KtPagination) => el.shadowRoot!.querySelector('.info')!.textContent!.trim();

describe('kt-pagination', () => {
  it('shows the position', async () => {
    const el = await fixture<KtPagination>(
      '<kt-pagination page="2" total-pages="7"></kt-pagination>',
    );
    expect(info(el).replace(/\s+/g, ' ')).toBe('Page 2 / 7');
  });

  it('disables the edges', async () => {
    const first = await fixture<KtPagination>(
      '<kt-pagination page="1" total-pages="3"></kt-pagination>',
    );
    expect(controls(first)[0]!.disabled).toBe(true);
    expect(controls(first)[1]!.disabled).toBe(false);

    const last = await fixture<KtPagination>(
      '<kt-pagination page="3" total-pages="3"></kt-pagination>',
    );
    expect(controls(last)[0]!.disabled).toBe(false);
    expect(controls(last)[1]!.disabled).toBe(true);
  });

  it('moves and reports', async () => {
    const el = await fixture<KtPagination>(
      '<kt-pagination page="2" total-pages="7"></kt-pagination>',
    );
    const listener = vi.fn();
    el.addEventListener('kt-page-change', listener);

    buttons(el)[1]!.click();
    await settle(el);
    expect(el.page).toBe(3);

    buttons(el)[0]!.click();
    await settle(el);
    expect(el.page).toBe(2);

    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('never leaves the range, even when driven past it', async () => {
    const el = await fixture<KtPagination>(
      '<kt-pagination page="1" total-pages="1"></kt-pagination>',
    );
    const listener = vi.fn();
    el.addEventListener('kt-page-change', listener);

    buttons(el)[1]!.click();
    buttons(el)[0]!.click();
    await settle(el);

    expect(el.page).toBe(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it('reuses kt-button rather than inventing a control', async () => {
    // A paging control with its own colours, hover and disabled states is how
    // a design system ends up with two kinds of button on one screen.
    const el = await fixture<KtPagination>('<kt-pagination total-pages="3"></kt-pagination>');
    expect(controls(el)).toHaveLength(2);
    for (const control of controls(el)) {
      expect(control.variant).toBe('dark');
      expect(control.size).toBe('small');
    }
    expect(el.shadowRoot!.querySelector('nav > button')).toBeNull();
  });
});
