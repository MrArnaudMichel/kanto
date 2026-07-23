import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '../../../test/fixture.js';
import './kt-pagination.js';
import type { KtPagination } from './kt-pagination.js';

const buttons = (el: KtPagination) => [
  ...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('button'),
];
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
    expect(buttons(first)[0]!.disabled).toBe(true);
    expect(buttons(first)[1]!.disabled).toBe(false);

    const last = await fixture<KtPagination>(
      '<kt-pagination page="3" total-pages="3"></kt-pagination>',
    );
    expect(buttons(last)[0]!.disabled).toBe(false);
    expect(buttons(last)[1]!.disabled).toBe(true);
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
});
