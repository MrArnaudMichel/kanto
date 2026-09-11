import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from 'kanto-ds/test/fixture';
import './kt-collapsible.js';
import type { KtCollapsible } from 'kanto-ds';

const details = (el: KtCollapsible) => el.shadowRoot!.querySelector('details')!;

describe('kt-collapsible', () => {
  it('is a details element, so it works before the script does', async () => {
    const el = await fixture<KtCollapsible>(
      '<kt-collapsible heading="Notifications">x</kt-collapsible>',
    );
    expect(details(el)).not.toBeNull();
    expect(el.shadowRoot!.querySelector('summary')).not.toBeNull();
  });

  it('renders the heading in the summary', async () => {
    const el = await fixture<KtCollapsible>(
      '<kt-collapsible heading="Security">x</kt-collapsible>',
    );
    expect(el.shadowRoot!.querySelector('summary')!.textContent).toContain('Security');
  });

  it('opens and closes, and reports it', async () => {
    const el = await fixture<KtCollapsible>('<kt-collapsible heading="General">x</kt-collapsible>');
    const toggled = vi.fn();
    el.addEventListener('kt-toggle', toggled);

    expect(details(el).open).toBe(false);

    details(el).open = true;
    details(el).dispatchEvent(new Event('toggle'));
    await settle(el);

    expect(el.open).toBe(true);
    expect(toggled.mock.calls[0]![0].detail).toEqual({ open: true });
  });

  it('follows the open property', async () => {
    const el = await fixture<KtCollapsible>(
      '<kt-collapsible open heading="General">x</kt-collapsible>',
    );
    expect(details(el).open).toBe(true);

    el.open = false;
    await settle(el);
    expect(details(el).open).toBe(false);
  });

  it('says nothing when the state did not change', async () => {
    const el = await fixture<KtCollapsible>('<kt-collapsible heading="General">x</kt-collapsible>');
    const toggled = vi.fn();
    el.addEventListener('kt-toggle', toggled);

    details(el).dispatchEvent(new Event('toggle'));
    await settle(el);
    expect(toggled).not.toHaveBeenCalled();
  });
});
