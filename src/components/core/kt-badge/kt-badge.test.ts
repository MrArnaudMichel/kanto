import { describe, expect, it } from 'vitest';
import { fixture, settle } from '../../../test/fixture.js';
import './kt-badge.js';
import type { KtBadge } from './kt-badge.js';

const base = (el: KtBadge) => el.shadowRoot!.querySelector('.badge')!;

describe('kt-badge', () => {
  it('renders slotted content through a slot', async () => {
    const el = await fixture<KtBadge>('<kt-badge>4</kt-badge>');
    const slot = base(el).querySelector('slot')!;
    expect(slot.assignedNodes({ flatten: true })[0]!.textContent).toBe('4');
  });

  it('falls back to the value attribute', async () => {
    const el = await fixture<KtBadge>('<kt-badge value="+12%"></kt-badge>');
    expect(base(el).textContent).toContain('+12%');
  });

  it('carries the variant as a class', async () => {
    const el = await fixture<KtBadge>('<kt-badge variant="danger">-2%</kt-badge>');
    expect(base(el).classList.contains('danger')).toBe(true);
  });

  it('caps a count at max', async () => {
    const el = await fixture<KtBadge>('<kt-badge max="99">128</kt-badge>');
    expect(base(el).textContent!.trim()).toBe('99+');

    el.value = '12';
    await settle(el);
    expect(base(el).textContent!.trim()).toBe('12');
  });

  it('leaves non-numeric content alone even with max set', async () => {
    const el = await fixture<KtBadge>('<kt-badge max="99">new</kt-badge>');
    expect(base(el).textContent!.trim()).toBe('new');
  });
});
