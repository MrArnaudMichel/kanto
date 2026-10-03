/**
 * The content opening and closing: a height transition only a browser runs.
 */
import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-collapsible.js';
import type { KtCollapsible } from 'kanto-ds';

async function mount(open = false): Promise<KtCollapsible> {
  const el = await fixture<KtCollapsible>(
    `<kt-collapsible heading="Shipping" ${open ? 'open' : ''}><p>Three to five days.</p></kt-collapsible>`,
  );
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return el;
}

const details = (el: KtCollapsible) => el.shadowRoot!.querySelector('details')!;
const height = (el: KtCollapsible) => details(el).getBoundingClientRect().height;
const summary = (el: KtCollapsible) =>
  el.shadowRoot!.querySelector('summary')!.getBoundingClientRect().height;
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
/** Past the theme's --duration-normal. */
const ENDED = 400;

// The height moves on ::details-content, which getAnimations() does not
// report, and sampling it mid-flight is at the mercy of a loaded machine: the
// set-up that makes it move is read instead, then where it ends.
describe('kt-collapsible motion', () => {
  it('transitions the content height, to and from auto', async () => {
    const el = await mount();
    const content = getComputedStyle(details(el), '::details-content');
    expect(content.transitionProperty).toContain('block-size');
    expect(parseFloat(content.transitionDuration)).toBeGreaterThan(0);
    expect(getComputedStyle(details(el)).getPropertyValue('interpolate-size')).toBe(
      'allow-keywords',
    );
    expect(content.blockSize).toBe('0px');
  });

  it('ends open at the content height, and closed at the summary height', async () => {
    const el = await mount();
    el.open = true;
    await settle(el);
    await wait(ENDED);
    expect(height(el)).toBeGreaterThan(summary(el) + 10);
    el.open = false;
    await settle(el);
    await wait(ENDED);
    expect(Math.abs(height(el) - summary(el))).toBeLessThanOrEqual(1);
  });

  it('is open at once when it first appears open', async () => {
    const el = await mount(true);
    const now = height(el);
    await wait(ENDED);
    expect(height(el)).toBe(now);
    expect(now).toBeGreaterThan(summary(el) + 10);
  });
});
