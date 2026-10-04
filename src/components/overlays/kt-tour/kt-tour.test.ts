import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-tour.js';
import type { KtTour } from 'kanto-ds';

afterEach(() => document.querySelectorAll('.tour-target').forEach((node) => node.remove()));

async function mount() {
  for (const id of ['search', 'invite']) {
    const target = document.body.appendChild(document.createElement('button'));
    target.id = id;
    target.className = 'tour-target';
  }
  const el = await fixture<KtTour>('<kt-tour></kt-tour>');
  el.steps = [
    { target: '#search', title: 'Search everything', body: 'Find any invoice or customer.' },
    { target: '#invite', title: 'Invite your team', body: 'Work on invoices together.' },
  ];
  await settle(el);
  return el;
}

const card = (el: KtTour) => el.shadowRoot!.querySelector<HTMLElement>('[role="dialog"]');
const button = (el: KtTour, name: string) =>
  [...el.shadowRoot!.querySelectorAll<HTMLElement>('kt-button')].find(
    (candidate) => (candidate.textContent!.trim() || candidate.getAttribute('label')) === name,
  )!;

describe('kt-tour', () => {
  it('shows nothing until started', async () => {
    const el = await mount();
    expect(card(el)).toBeNull();
  });

  it('starts on the first step: a dialog named by its title, with its place and its words', async () => {
    const el = await mount();
    el.start();
    await settle(el);
    expect(el.open).toBe(true);
    const dialog = card(el)!;
    const title = dialog.querySelector(`#${dialog.getAttribute('aria-labelledby')}`)!;
    expect(title.textContent!.trim()).toBe('Search everything');
    expect(dialog.textContent).toContain('Find any invoice or customer.');
    expect(dialog.textContent).toContain('Step 1 of 2');
  });

  it('goes on and back, saying which step it is on', async () => {
    const el = await mount();
    const stepped = vi.fn();
    el.addEventListener('kt-step', stepped);
    el.start();
    await settle(el);
    button(el, 'Next').click();
    await settle(el);
    expect(el.index).toBe(1);
    expect(card(el)!.textContent).toContain('Invite your team');
    expect(stepped.mock.calls.at(-1)![0].detail).toEqual({ index: 1 });
    button(el, 'Previous').click();
    await settle(el);
    expect(el.index).toBe(0);
  });

  it('has no Previous on the first step, and Done on the last, which finishes', async () => {
    const el = await mount();
    const finished = vi.fn();
    el.addEventListener('kt-finish', finished);
    el.start();
    await settle(el);
    expect(button(el, 'Previous')).toBeUndefined();
    button(el, 'Next').click();
    await settle(el);
    button(el, 'Done').click();
    await settle(el);
    expect(el.open).toBe(false);
    expect(finished).toHaveBeenCalledOnce();
  });

  it('closes on its close button and on Escape, saying so', async () => {
    const el = await mount();
    const closed = vi.fn();
    el.addEventListener('kt-close', closed);
    el.start();
    await settle(el);
    button(el, 'Close').click();
    await settle(el);
    expect(el.open).toBe(false);
    el.start(1);
    await settle(el);
    expect(el.index).toBe(1);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await settle(el);
    expect(el.open).toBe(false);
    expect(closed).toHaveBeenCalledTimes(2);
  });

  it('moves the focus to the step as it shows', async () => {
    const el = await mount();
    el.start();
    await settle(el);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(el.shadowRoot!.activeElement).toBe(card(el));
  });
});
