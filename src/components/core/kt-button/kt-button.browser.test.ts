/**
 * run(), as it is seen: the plane flying off, the tick coming in, the width
 * following the label, the shake of a failure.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { Send } from 'lucide';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-button.js';
import { registerIcons } from 'kanto-ds';
import type { KtButton } from 'kanto-ds';

registerIcons({ Send });

const TOKENS = ['--duration-instant', '--duration-fast', '--duration-normal', '--duration-slow'];
afterEach(() => {
  for (const token of TOKENS) document.documentElement.style.removeProperty(token);
});

/** Every animation run() plays, wherever it plays it. */
function played(el: KtButton): Map<string, Animation> {
  const all = [el, ...el.shadowRoot!.querySelectorAll('*')].flatMap((node) => node.getAnimations());
  return new Map(all.filter((a) => a.id.startsWith('kt-button')).map((a) => [a.id, a]));
}
const keyframes = (animation: Animation) => (animation.effect as KeyframeEffect).getKeyframes();

async function mount(): Promise<KtButton> {
  const el = await fixture<KtButton>(
    '<kt-button icon="send" done-label="Sent to the team">Send</kt-button>',
  );
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return el;
}

describe('kt-button run(), in motion', () => {
  it('flies the plane off to the top right, then brings the tick in', async () => {
    const el = await mount();
    const seen: Map<string, Animation>[] = [];
    const watching = setInterval(() => seen.push(played(el)), 10);
    await el.run(() => Promise.resolve());
    await settle(el);
    seen.push(played(el));
    clearInterval(watching);

    const leave = seen.map((m) => m.get('kt-button-leave')).find(Boolean)!;
    expect(leave).toBeDefined();
    const [x, y] = String(keyframes(leave).at(-1)!.translate).split(' ').map(parseFloat);
    expect(x).toBeGreaterThan(0);
    expect(y).toBeLessThan(0);
    expect(Number(keyframes(leave).at(-1)!.opacity)).toBe(0);
    expect(played(el).has('kt-button-arrive')).toBe(true);
  });

  it('widens to the done label instead of jumping', async () => {
    const el = await mount();
    const before = el.getBoundingClientRect().width;
    await el.run(() => Promise.resolve());
    await settle(el);
    const resize = played(el).get('kt-button-resize')!;
    expect(resize).toBeDefined();
    expect(parseFloat(String(keyframes(resize)[0]!.width))).toBeCloseTo(before, 0);
    await resize.finished;
    expect(el.getBoundingClientRect().width).toBeGreaterThan(before);
  });

  it('shakes when the action fails', async () => {
    const el = await mount();
    await el.run(() => Promise.reject(new Error('offline'))).catch(() => undefined);
    await settle(el);
    expect(played(el).has('kt-button-shake')).toBe(true);
    expect(played(el).has('kt-button-leave')).toBe(false);
  });

  it('only changes its label and icon when the theme says no motion', async () => {
    for (const token of TOKENS) document.documentElement.style.setProperty(token, '0s');
    const el = await mount();
    await el.run(() => Promise.resolve());
    await settle(el);
    expect(played(el).size).toBe(0);
    expect(el.shadowRoot!.querySelector('[part="icon"]')!.getAttribute('name')).toBe('check');
  });
});
