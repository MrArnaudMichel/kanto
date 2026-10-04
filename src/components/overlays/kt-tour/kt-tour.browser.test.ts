/** The light around the target, and the card beside it, not over it. */
import { afterEach, describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-tour.js';
import type { KtTour } from 'kanto-ds';

afterEach(() => document.querySelector('#tour-target')?.remove());

async function mount(withTarget = true) {
  if (withTarget) {
    const target = document.body.appendChild(document.createElement('button'));
    target.id = 'tour-target';
    target.textContent = 'Search';
    target.style.cssText =
      'position: absolute; top: 120px; left: 200px; width: 160px; height: 40px';
  }
  const el = await fixture<KtTour>('<kt-tour></kt-tour>');
  el.steps = [
    withTarget
      ? { target: '#tour-target', title: 'Search everything', body: 'Find anything.' }
      : { title: 'Search everything', body: 'Find anything.' },
  ];
  el.start();
  await settle(el);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return el;
}

describe('kt-tour, laid out', () => {
  it('lights its target, with a little room around it, in the top layer', async () => {
    const el = await mount();
    const spotlight = el.shadowRoot!.querySelector('.spotlight')!;
    expect(spotlight.matches(':popover-open')).toBe(true);
    const lit = spotlight.getBoundingClientRect();
    const target = document.querySelector('#tour-target')!.getBoundingClientRect();
    expect(lit.left).toBeLessThan(target.left);
    expect(lit.right).toBeGreaterThan(target.right);
    expect(lit.top).toBeLessThan(target.top);
  });

  it('sets the card beside the target, never over it', async () => {
    const el = await mount();
    const card = el.shadowRoot!.querySelector('.card')!.getBoundingClientRect();
    const target = document.querySelector('#tour-target')!.getBoundingClientRect();
    const overlaps =
      card.left < target.right &&
      card.right > target.left &&
      card.top < target.bottom &&
      card.bottom > target.top;
    expect(overlaps).toBe(false);
  });

  it('centres the card for a step that points at nothing', async () => {
    const el = await mount(false);
    const card = el.shadowRoot!.querySelector('.card')!.getBoundingClientRect();
    expect(Math.abs(card.left + card.width / 2 - innerWidth / 2)).toBeLessThan(2);
    expect(el.shadowRoot!.querySelector('.spotlight')).toBeNull();
  });
});
