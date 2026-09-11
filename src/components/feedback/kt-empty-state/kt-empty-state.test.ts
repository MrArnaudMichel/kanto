import { describe, expect, it } from 'vitest';
import { fixture } from 'kanto-ds/test/fixture';
import './kt-empty-state.js';
import type { KtEmptyState } from 'kanto-ds';

describe('kt-empty-state', () => {
  it('renders an icon, a heading and a description', async () => {
    const el = await fixture<KtEmptyState>(
      '<kt-empty-state icon="inbox" heading="Nothing here" description="New messages appear here."></kt-empty-state>',
    );
    expect(el.shadowRoot!.querySelector('kt-icon')!.getAttribute('name')).toBe('inbox');
    expect(el.shadowRoot!.querySelector('.heading')!.textContent).toContain('Nothing here');
    expect(el.shadowRoot!.querySelector('.description')!.textContent).toContain('New messages');
  });

  it('drops the parts it was not given', async () => {
    const el = await fixture<KtEmptyState>('<kt-empty-state icon=""></kt-empty-state>');
    expect(el.shadowRoot!.querySelector('.icon')).toBeNull();
    expect(el.shadowRoot!.querySelector('.heading')).toBeNull();
    expect(el.shadowRoot!.querySelector('.description')).toBeNull();
  });

  it('offers an actions slot', async () => {
    const el = await fixture<KtEmptyState>(
      '<kt-empty-state heading="Empty"><button slot="actions">Compose</button></kt-empty-state>',
    );
    expect(el.shadowRoot!.querySelector('slot[name="actions"]')).not.toBeNull();
  });
});
