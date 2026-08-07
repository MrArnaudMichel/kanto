import { describe, expect, it } from 'vitest';
import { fixture, settle } from '../../../test/fixture.js';
import './kt-stat.js';
import type { KtStat } from './kt-stat.js';

const badge = (el: KtStat) => el.shadowRoot!.querySelector('kt-badge');

describe('kt-stat', () => {
  it('renders the label and the value', async () => {
    const el = await fixture<KtStat>('<kt-stat label="Revenue" value="$292,342"></kt-stat>');
    expect(el.shadowRoot!.querySelector('.label')!.textContent).toContain('Revenue');
    expect(el.shadowRoot!.querySelector('.value')!.textContent).toContain('$292,342');
  });

  it('colours the delta by meaning, not by sign', async () => {
    // Revenue falling is bad news even though the number went down.
    const falling = await fixture<KtStat>('<kt-stat delta="-3%" trend="down"></kt-stat>');
    expect(badge(falling)!.getAttribute('variant')).toBe('danger');

    // Churn falling is good news, and the sign is identical.
    const churn = await fixture<KtStat>('<kt-stat delta="-3%" trend="down" inverted></kt-stat>');
    expect(badge(churn)!.getAttribute('variant')).toBe('success');
  });

  it('stays neutral when the trend is flat or unstated', async () => {
    const el = await fixture<KtStat>('<kt-stat delta="+0%"></kt-stat>');
    expect(badge(el)!.getAttribute('variant')).toBe('neutral');
  });

  it('shows no badge without a delta', async () => {
    const el = await fixture<KtStat>('<kt-stat label="Orders" value="178"></kt-stat>');
    expect(badge(el)).toBeNull();
  });

  it('replaces the figure with a placeholder while loading', async () => {
    const el = await fixture<KtStat>('<kt-stat label="Orders" value="178" loading></kt-stat>');
    expect(el.shadowRoot!.querySelector('.value')).toBeNull();
    expect(el.shadowRoot!.querySelector('kt-skeleton')).not.toBeNull();

    el.loading = false;
    await settle(el);
    expect(el.shadowRoot!.querySelector('.value')!.textContent).toContain('178');
  });
});
