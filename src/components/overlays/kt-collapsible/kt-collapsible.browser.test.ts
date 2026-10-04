/**
 * The content opening and closing, in every browser: the height animated
 * from script, the details kept open until the fold is done.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-collapsible.js';
import type { KtCollapsible } from 'kanto-ds';

const TOKENS = ['--duration-instant', '--duration-fast', '--duration-normal', '--duration-slow'];
afterEach(() => {
  for (const token of TOKENS) document.documentElement.style.removeProperty(token);
});

/**
 * A real click or key goes through the test browser, which on a loaded
 * machine can take longer than the fold itself: the fold is slowed, so it is
 * still running when the test looks.
 */
function slow(): void {
  document.documentElement.style.setProperty('--duration-normal', '5s');
}

async function mount(open = false): Promise<KtCollapsible> {
  const el = await fixture<KtCollapsible>(
    `<kt-collapsible heading="Shipping" ${open ? 'open' : ''}><p>Three to five days, tracked all the way.</p></kt-collapsible>`,
  );
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return el;
}

const details = (el: KtCollapsible) => el.shadowRoot!.querySelector('details')!;
const content = (el: KtCollapsible) => el.shadowRoot!.querySelector<HTMLElement>('.content')!;
const fold = (el: KtCollapsible) =>
  content(el)
    .getAnimations()
    .find((a) => a.id === 'kt-collapsible-fold');
const frames = (animation: Animation) => (animation.effect as KeyframeEffect).getKeyframes();

describe('kt-collapsible motion', () => {
  it('unfolds the content from nothing to its height, fading in', async () => {
    slow();
    const el = await mount();
    await userEvent.click(el.shadowRoot!.querySelector('summary')!);
    await settle(el);
    const animation = fold(el)!;
    expect(animation).toBeDefined();
    const [from, to] = [frames(animation)[0]!, frames(animation).at(-1)!];
    expect(from.height).toBe('0px');
    expect(Number(from.opacity)).toBe(0);
    expect(parseFloat(String(to.height))).toBeGreaterThan(10);
    expect(el.open).toBe(true);
    animation.finish();
    await animation.finished;
    expect(content(el).style.height).toBe('');
  });

  it('folds it away before the details close, and says so once', async () => {
    const el = await mount(true);
    let toggles = 0;
    el.addEventListener('kt-toggle', () => (toggles += 1));
    await userEvent.click(el.shadowRoot!.querySelector('summary')!);
    await settle(el);
    expect(el.open).toBe(false);
    // Still drawn while it folds.
    expect(details(el).open).toBe(true);
    const animation = fold(el)!;
    expect(frames(animation).at(-1)!.height).toBe('0px');
    await animation.finished;
    await settle(el);
    expect(details(el).open).toBe(false);
    expect(toggles).toBe(1);
  });

  it('turns back from where it is when clicked again half-way', async () => {
    const el = await mount();
    const summary = el.shadowRoot!.querySelector('summary')!;
    summary.click();
    await settle(el);
    const opening = fold(el)!;
    opening.pause();
    opening.currentTime = (opening.effect!.getComputedTiming().duration as number) / 2;
    const halfway = content(el).getBoundingClientRect().height;
    summary.click();
    await settle(el);
    const closing = fold(el)!;
    expect(closing).not.toBe(opening);
    expect(parseFloat(String(frames(closing)[0]!.height))).toBeCloseTo(halfway, 0);
    await closing.finished;
    await settle(el);
    expect(details(el).open).toBe(false);
  });

  it('is open at once when it first appears open', async () => {
    const el = await mount(true);
    expect(fold(el)).toBeUndefined();
    expect(content(el).getBoundingClientRect().height).toBeGreaterThan(10);
  });

  it('opens and closes at once when the theme says no motion', async () => {
    for (const token of TOKENS) document.documentElement.style.setProperty(token, '0s');
    const el = await mount();
    const summary = el.shadowRoot!.querySelector('summary')!;
    summary.click();
    await settle(el);
    expect(fold(el)).toBeUndefined();
    expect(details(el).open).toBe(true);
    summary.click();
    await settle(el);
    expect(details(el).open).toBe(false);
  });

  it('opens from the keyboard the same way', async () => {
    slow();
    const el = await mount();
    el.shadowRoot!.querySelector<HTMLElement>('summary')!.focus();
    await userEvent.keyboard('{Enter}');
    await settle(el);
    expect(el.open).toBe(true);
    expect(fold(el)).toBeDefined();
  });

  it('moves smoothly from nothing to the full height and back, without a jump at either end', async () => {
    const el = await mount();
    const summary = el.shadowRoot!.querySelector('summary')!;
    const box = () => content(el).getBoundingClientRect().height;
    const trace = async () => {
      const heights: number[] = [];
      const animation = fold(el)!;
      while (animation.playState === 'running') {
        heights.push(box());
        await new Promise((resolve) => requestAnimationFrame(resolve));
      }
      await new Promise((resolve) => requestAnimationFrame(resolve));
      heights.push(box());
      return heights;
    };

    summary.click();
    await settle(el);
    const opening = await trace();
    expect(opening[0]).toBeLessThanOrEqual(1);
    const full = opening.at(-1)!;
    expect(Math.max(...opening)).toBeLessThanOrEqual(full + 0.5);

    summary.click();
    await settle(el);
    const closing = await trace();
    expect(Math.min(...closing.slice(0, -1))).toBeLessThanOrEqual(1);
    expect(Math.max(...closing)).toBeLessThanOrEqual(full + 0.5);
  });

  describe('the chevron', () => {
    const chevron = (el: KtCollapsible) => el.shadowRoot!.querySelector('.chevron')!;
    const turning = (el: KtCollapsible) =>
      chevron(el)
        .getAnimations()
        .filter((a) => a instanceof CSSTransition && a.transitionProperty === 'transform');

    it('turns as soon as it is closed, alongside the fold, not after it', async () => {
      const el = await mount(true);
      el.shadowRoot!.querySelector('summary')!.click();
      await settle(el);
      // Still folding: the details is open, and the chevron already on its way back.
      expect(details(el).open).toBe(true);
      expect(turning(el)).toHaveLength(1);
      const timing = turning(el)[0]!.effect!.getComputedTiming();
      expect(timing.duration).toBe(fold(el)!.effect!.getComputedTiming().duration);
    });

    it('turns on opening, with a little overshoot', async () => {
      const el = await mount();
      el.shadowRoot!.querySelector('summary')!.click();
      await settle(el);
      expect(turning(el)).toHaveLength(1);
      expect(getComputedStyle(chevron(el)).transitionTimingFunction).toMatch(
        /cubic-bezier\(.*1\.[0-9]/,
      );
    });

    it('is already turned, and still, when it first appears open', async () => {
      const el = await mount(true);
      expect(turning(el)).toHaveLength(0);
      expect(getComputedStyle(chevron(el)).transform).not.toBe('none');
    });
  });

  it('drops its rule when plain, and keeps it otherwise', async () => {
    const ruled = await mount();
    expect(getComputedStyle(details(ruled)).borderBottomStyle).toBe('solid');
    const plain = await fixture<KtCollapsible>(
      '<kt-collapsible heading="x" plain>y</kt-collapsible>',
    );
    expect(getComputedStyle(details(plain)).borderBottomStyle).toBe('none');
  });
});
