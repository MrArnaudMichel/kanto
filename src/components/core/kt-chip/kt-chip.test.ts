import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '../../../test/fixture.js';
import './kt-chip.js';
import type { KtChip } from './kt-chip.js';

const base = (el: KtChip) => el.shadowRoot!.querySelector<HTMLElement>('.chip')!;

describe('kt-chip', () => {
  it('is a pill tag by default', async () => {
    const el = await fixture<KtChip>('<kt-chip>Active</kt-chip>');
    expect(base(el).classList.contains('tag')).toBe(true);
  });

  it('falls back to the label attribute when nothing is slotted', async () => {
    const el = await fixture<KtChip>('<kt-chip label="Draft"></kt-chip>');
    expect(base(el).textContent).toContain('Draft');
  });

  it('exposes the category colour as a custom property', async () => {
    const el = await fixture<KtChip>('<kt-chip variant="category" color="#35DD83">OK</kt-chip>');
    expect(base(el).classList.contains('category')).toBe(true);
    expect(base(el).style.getPropertyValue('--kt-chip-color')).toBe('#35DD83');
  });

  it('sets no inline colour when none was given', async () => {
    const el = await fixture<KtChip>('<kt-chip variant="category">OK</kt-chip>');
    expect(base(el).style.getPropertyValue('--kt-chip-color')).toBe('');
  });

  it('layers the error palette over any variant', async () => {
    const el = await fixture<KtChip>('<kt-chip variant="category" error>Failed</kt-chip>');
    expect(base(el).classList.contains('error')).toBe(true);
    expect(base(el).classList.contains('category')).toBe(true);
  });

  it('is only interactive when clickable', async () => {
    const el = await fixture<KtChip>('<kt-chip>Active</kt-chip>');
    const listener = vi.fn();
    el.addEventListener('kt-chip-click', listener);

    base(el).dispatchEvent(new MouseEvent('click'));
    expect(listener).not.toHaveBeenCalled();
    expect(base(el).hasAttribute('tabindex')).toBe(false);

    el.clickable = true;
    await settle(el);
    expect(base(el).getAttribute('role')).toBe('button');
    base(el).dispatchEvent(new MouseEvent('click'));
    base(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
