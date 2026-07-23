import { describe, expect, it } from 'vitest';
import { fixture, settle } from '../../../test/fixture.js';
import './kt-progress-bar.js';
import type { KtProgressBar } from './kt-progress-bar.js';

const track = (el: KtProgressBar) => el.shadowRoot!.querySelector('.track')!;
const fill = (el: KtProgressBar) => el.shadowRoot!.querySelector<HTMLElement>('.fill')!;

describe('kt-progress-bar', () => {
  it('exposes the value to assistive technology', async () => {
    const el = await fixture<KtProgressBar>('<kt-progress-bar value="40"></kt-progress-bar>');
    expect(track(el).getAttribute('role')).toBe('progressbar');
    expect(track(el).getAttribute('aria-valuenow')).toBe('40');
    expect(track(el).getAttribute('aria-valuemax')).toBe('100');
    expect(track(el).getAttribute('aria-valuetext')).toBe('40%');
  });

  it('fills proportionally', async () => {
    const el = await fixture<KtProgressBar>('<kt-progress-bar value="25"></kt-progress-bar>');
    expect(fill(el).style.width).toBe('25%');
  });

  it('scales against a custom max', async () => {
    const el = await fixture<KtProgressBar>(
      '<kt-progress-bar value="3" max="4"></kt-progress-bar>',
    );
    expect(el.percent).toBe(75);
    expect(fill(el).style.width).toBe('75%');
  });

  it('clamps out-of-range values instead of overflowing the track', async () => {
    const over = await fixture<KtProgressBar>('<kt-progress-bar value="500"></kt-progress-bar>');
    expect(over.percent).toBe(100);

    const under = await fixture<KtProgressBar>('<kt-progress-bar value="-20"></kt-progress-bar>');
    expect(under.percent).toBe(0);
  });

  it('survives a max of zero rather than dividing by it', async () => {
    const el = await fixture<KtProgressBar>(
      '<kt-progress-bar value="10" max="0"></kt-progress-bar>',
    );
    expect(Number.isFinite(el.percent)).toBe(true);
    expect(el.percent).toBe(10);
  });

  it('turns green on completion whatever the variant', async () => {
    const el = await fixture<KtProgressBar>(
      '<kt-progress-bar value="100" variant="warning"></kt-progress-bar>',
    );
    expect(fill(el).classList.contains('complete')).toBe(true);
  });

  it('shows the percentage only when asked', async () => {
    const el = await fixture<KtProgressBar>('<kt-progress-bar value="42"></kt-progress-bar>');
    expect(el.shadowRoot!.querySelector('.label')).toBeNull();

    el.showValue = true;
    await settle(el);
    expect(el.shadowRoot!.querySelector('.label')!.textContent!.trim()).toBe('42%');
  });
});
