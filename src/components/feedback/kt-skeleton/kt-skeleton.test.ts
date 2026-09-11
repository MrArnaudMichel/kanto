import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-skeleton.js';
import type { KtSkeleton } from 'kanto';

const lines = (el: KtSkeleton) => [...el.shadowRoot!.querySelectorAll<HTMLElement>('.line')];

describe('kt-skeleton', () => {
  it('draws one full-width text line by default', async () => {
    const el = await fixture<KtSkeleton>('<kt-skeleton></kt-skeleton>');
    expect(lines(el)).toHaveLength(1);
    expect(lines(el)[0]!.style.width).toBe('100%');
    expect(lines(el)[0]!.style.height).toBe('14px');
  });

  it('shortens the last line of a paragraph', async () => {
    const el = await fixture<KtSkeleton>('<kt-skeleton count="3"></kt-skeleton>');
    expect(lines(el).map((l) => l.style.width)).toEqual(['100%', '100%', '60%']);
  });

  it('leaves non-text variants uniform', async () => {
    const el = await fixture<KtSkeleton>('<kt-skeleton variant="rect" count="2"></kt-skeleton>');
    expect(lines(el).map((l) => l.style.width)).toEqual(['100%', '100%']);
    expect(lines(el)[0]!.style.height).toBe('80px');
  });

  it('defaults a circle to 40px square', async () => {
    const el = await fixture<KtSkeleton>('<kt-skeleton variant="circle"></kt-skeleton>');
    expect(lines(el)[0]!.style.width).toBe('40px');
    expect(lines(el)[0]!.style.height).toBe('40px');
  });

  it('honours explicit dimensions', async () => {
    const el = await fixture<KtSkeleton>('<kt-skeleton width="120px" height="30px"></kt-skeleton>');
    expect(lines(el)[0]!.style.width).toBe('120px');
    expect(lines(el)[0]!.style.height).toBe('30px');
  });

  it('is hidden from assistive technology', async () => {
    const el = await fixture<KtSkeleton>('<kt-skeleton></kt-skeleton>');
    expect(el.getAttribute('aria-hidden')).toBe('true');
  });

  it('can drop the pulse', async () => {
    const el = await fixture<KtSkeleton>('<kt-skeleton></kt-skeleton>');
    expect(lines(el)[0]!.classList.contains('pulse')).toBe(true);

    el.animated = false;
    await settle(el);
    expect(lines(el)[0]!.classList.contains('pulse')).toBe(false);
  });
});
