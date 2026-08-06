import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '../../../test/fixture.js';
import './kt-alert.js';
import type { KtAlert } from './kt-alert.js';

const base = (el: KtAlert) => el.shadowRoot!.querySelector('.alert')!;
const icon = (el: KtAlert) => el.shadowRoot!.querySelector('kt-icon');

describe('kt-alert', () => {
  it('picks an icon per variant', async () => {
    const warning = await fixture<KtAlert>('<kt-alert variant="warning"></kt-alert>');
    expect(icon(warning)!.getAttribute('name')).toBe('triangle-alert');

    const success = await fixture<KtAlert>('<kt-alert variant="success"></kt-alert>');
    expect(icon(success)!.getAttribute('name')).toBe('circle-check');
  });

  it('lets the caller override the icon, or drop it', async () => {
    const custom = await fixture<KtAlert>('<kt-alert icon="users"></kt-alert>');
    expect(icon(custom)!.getAttribute('name')).toBe('users');

    const none = await fixture<KtAlert>('<kt-alert no-icon></kt-alert>');
    expect(none.shadowRoot!.querySelector('.icon')).toBeNull();
  });

  it('interrupts for danger and waits its turn otherwise', async () => {
    const danger = await fixture<KtAlert>('<kt-alert variant="danger"></kt-alert>');
    expect(base(danger).getAttribute('aria-live')).toBe('assertive');

    const info = await fixture<KtAlert>('<kt-alert variant="info"></kt-alert>');
    expect(base(info).getAttribute('aria-live')).toBe('polite');
  });

  it('shows a dismiss button only when asked, and reports it', async () => {
    const plain = await fixture<KtAlert>('<kt-alert></kt-alert>');
    expect(plain.shadowRoot!.querySelector('.close')).toBeNull();

    const closable = await fixture<KtAlert>('<kt-alert dismissible></kt-alert>');
    const closed = vi.fn();
    closable.addEventListener('kt-close', closed);

    closable.shadowRoot!.querySelector<HTMLButtonElement>('.close')!.click();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('renders heading and description when given', async () => {
    const el = await fixture<KtAlert>(
      '<kt-alert heading="Storage almost full" description="88% used."></kt-alert>',
    );
    expect(el.shadowRoot!.querySelector('.heading')!.textContent).toContain('Storage almost full');
    expect(el.shadowRoot!.querySelector('.description')!.textContent).toContain('88% used.');

    el.description = '';
    await settle(el);
    expect(el.shadowRoot!.querySelector('.description')).toBeNull();
  });
});
