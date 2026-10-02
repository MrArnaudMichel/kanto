import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '../../../test/fixture.js';
import './kt-badge.js';
import type { KtBadge } from './kt-badge.js';

const base = (el: KtBadge) => el.shadowRoot!.querySelector('.badge')!;

describe('kt-badge', () => {
  it('takes its text from the slot, or from label', async () => {
    const slotted = await fixture<KtBadge>('<kt-badge>Active</kt-badge>');
    expect(slotted.textContent!.trim()).toBe('Active');

    const labelled = await fixture<KtBadge>('<kt-badge label="Archived"></kt-badge>');
    expect(base(labelled).textContent!.trim()).toBe('Archived');
  });

  it('is a pill tag by default', async () => {
    const el = await fixture<KtBadge>('<kt-badge>Tag</kt-badge>');
    expect(base(el).classList.contains('tag')).toBe(true);
  });

  it('keeps shape and colour on separate axes', async () => {
    // A tag can be dangerous and so can a count; folding the two lists
    // together would give nine variants and no way to say "a tag, but a
    // warning".
    const el = await fixture<KtBadge>('<kt-badge variant="count" tone="danger">3</kt-badge>');
    expect(base(el).classList.contains('count')).toBe(true);
    expect(base(el).classList.contains('danger')).toBe(true);
  });

  it('leaves neutral unclassed, so the base colours stand', async () => {
    const el = await fixture<KtBadge>('<kt-badge>Plain</kt-badge>');
    expect(base(el).classList.contains('neutral')).toBe(false);
  });

  it('tints a category with any colour notation', async () => {
    for (const color of ['#3987e5', 'rgb(57, 135, 229)', 'var(--color-success-base)']) {
      const el = await fixture<KtBadge>(
        `<kt-badge variant="category" color="${color}">C</kt-badge>`,
      );
      expect(base(el).getAttribute('style')).toContain(color);
    }
  });

  it('caps a numeric label at max', async () => {
    const el = await fixture<KtBadge>('<kt-badge variant="count" max="99">128</kt-badge>');
    expect(base(el).textContent!.trim()).toBe('99+');

    el.max = 200;
    await settle(el);
    expect(base(el).textContent!.trim()).toBe('128');
  });

  it('leaves a non-numeric label alone even with max set', async () => {
    const el = await fixture<KtBadge>('<kt-badge max="99">Beta</kt-badge>');
    expect(base(el).textContent!.trim()).toBe('Beta');
  });

  it('treats error as shorthand for the danger tone', async () => {
    const el = await fixture<KtBadge>('<kt-badge error>Failed</kt-badge>');
    expect(base(el).classList.contains('danger')).toBe(true);
  });

  it('is inert unless clickable', async () => {
    const quiet = await fixture<KtBadge>('<kt-badge>Static</kt-badge>');
    expect(base(quiet).getAttribute('role')).toBeNull();
    expect(base(quiet).getAttribute('tabindex')).toBeNull();

    const listener = vi.fn();
    quiet.addEventListener('kt-badge-click', listener);
    base(quiet).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(listener).not.toHaveBeenCalled();
  });

  it('is a real control when clickable', async () => {
    const el = await fixture<KtBadge>('<kt-badge clickable>Filter</kt-badge>');
    expect(base(el).getAttribute('role')).toBe('button');
    expect(base(el).getAttribute('tabindex')).toBe('0');

    const listener = vi.fn();
    el.addEventListener('kt-badge-click', listener);

    base(el).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    for (const key of ['Enter', ' ']) {
      base(el).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    }
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('offers a remove button that does not double-fire a clickable badge', async () => {
    const el = await fixture<KtBadge>('<kt-badge clickable removable>Region</kt-badge>');
    const removed = vi.fn();
    const clicked = vi.fn();
    el.addEventListener('kt-remove', removed);
    el.addEventListener('kt-badge-click', clicked);

    el.shadowRoot!.querySelector<HTMLButtonElement>('.remove')!.click();
    expect(removed).toHaveBeenCalledTimes(1);
    expect(clicked).not.toHaveBeenCalled();
  });

  it('names the remove button after what it removes', async () => {
    const el = await fixture<KtBadge>('<kt-badge removable label="North East"></kt-badge>');
    expect(el.shadowRoot!.querySelector('.remove')!.getAttribute('aria-label')).toBe(
      'Remove North East',
    );
  });

  it('shows an icon before the text when asked', async () => {
    const el = await fixture<KtBadge>('<kt-badge icon="user">Assigned</kt-badge>');
    expect(el.shadowRoot!.querySelector('kt-icon')!.getAttribute('name')).toBe('user');
  });
});
