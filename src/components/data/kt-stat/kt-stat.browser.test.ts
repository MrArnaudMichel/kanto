/** A figure that changes: the new one comes up into place. */
import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-stat.js';
import type { KtStat } from 'kanto-ds';

const rising = (el: KtStat) =>
  el
    .shadowRoot!.querySelector('.value')!
    .getAnimations()
    .filter((a) => a.id === 'kt-stat-value');

describe('kt-stat motion', () => {
  it('brings a new value up into place, and nothing when it first appears', async () => {
    const el = await fixture<KtStat>('<kt-stat label="Revenue" value="$12,400"></kt-stat>');
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(rising(el)).toHaveLength(0);

    el.value = '$13,050';
    await settle(el);
    expect(rising(el)).toHaveLength(1);
  });

  it('stays still when another property changes', async () => {
    const el = await fixture<KtStat>('<kt-stat label="Revenue" value="$12,400"></kt-stat>');
    el.caption = 'This month';
    await settle(el);
    expect(rising(el)).toHaveLength(0);
  });
});
