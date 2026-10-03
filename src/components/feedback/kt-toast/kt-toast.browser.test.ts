/**
 * A toast's entrance and exit: only a browser runs the animations, and only
 * with the theme loaded are the durations not zero.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-toast.js';
import '../kt-toast-container/kt-toast-container.js';
import type { KtToastContainer } from 'kanto-ds';

const root = document.documentElement;

const TOKENS = ['--duration-instant', '--duration-fast', '--duration-normal', '--duration-slow'];
/** Its own animations, not the theme's colour transitions. */
const moves = (el: Element) =>
  el.getAnimations().filter((animation) => animation.id.startsWith('kt-toast'));

afterEach(() => {
  for (const token of TOKENS) root.style.removeProperty(token);
});

describe('kt-toast-container motion', () => {
  it('slides a new toast in, and the stack makes room for it', async () => {
    const el = await fixture<KtToastContainer>('<kt-toast-container></kt-toast-container>');
    el.show({ heading: 'First' });
    const toast = el.show({ heading: 'Second' });
    await settle(el);
    const running = moves(toast);
    expect(running).toHaveLength(1);
    const [from] = (running[0]!.effect as KeyframeEffect).getKeyframes();
    expect(Number(from!.opacity)).toBe(0);
    expect(from!.height).toBe('0px');
    await running[0]!.finished;
    expect(moves(toast)).toHaveLength(0);
  });

  it('lets a closed toast fade and fold before it goes', async () => {
    const el = await fixture<KtToastContainer>('<kt-toast-container></kt-toast-container>');
    const toast = el.show({ heading: 'Saved' });
    await Promise.all(moves(toast).map((animation) => animation.finished));

    toast.close();
    expect(el.toasts).toHaveLength(0);
    expect(toast.isConnected).toBe(true);
    expect(toast.hasAttribute('leaving')).toBe(true);
    const [leaving] = moves(toast);
    const keyframes = (leaving!.effect as KeyframeEffect).getKeyframes();
    expect(Number(keyframes.at(-1)!.opacity)).toBe(0);
    expect(keyframes.at(-1)!.height).toBe('0px');

    await leaving!.finished;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(toast.isConnected).toBe(false);
  });

  it('a leaving toast cannot be clicked or announced again', async () => {
    const el = await fixture<KtToastContainer>('<kt-toast-container></kt-toast-container>');
    const toast = el.show({ heading: 'Saved' });
    toast.close();
    expect(getComputedStyle(toast).pointerEvents).toBe('none');
    expect(toast.getAttribute('aria-hidden')).toBe('true');
  });

  it('neither slides nor fades when the theme says no motion', async () => {
    // What prefers-reduced-motion does to the theme.
    for (const token of TOKENS) root.style.setProperty(token, '0s');
    const el = await fixture<KtToastContainer>('<kt-toast-container></kt-toast-container>');
    const toast = el.show({ heading: 'Saved' });
    await settle(el);
    expect(moves(toast)).toHaveLength(0);
    toast.close();
    expect(toast.isConnected).toBe(false);
  });
});
