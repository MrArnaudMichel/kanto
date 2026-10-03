/** The tick comes in when the box is checked, not when it opens checked. */
import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-checkbox.js';
import type { KtCheckbox } from 'kanto-ds';

const ticking = (el: KtCheckbox) =>
  [...el.shadowRoot!.querySelectorAll('kt-icon')].flatMap((icon) =>
    icon
      .getAnimations()
      .filter((a) => a instanceof CSSAnimation && a.animationName === 'kt-checkbox-tick'),
  );

describe('kt-checkbox motion', () => {
  it('brings the tick in when checked', async () => {
    const el = await fixture<KtCheckbox>('<kt-checkbox>Accept</kt-checkbox>');
    el.checked = true;
    await settle(el);
    expect(ticking(el)).toHaveLength(1);
  });

  it('is still when it first appears checked, or re-renders for something else', async () => {
    const el = await fixture<KtCheckbox>('<kt-checkbox checked>Accept</kt-checkbox>');
    expect(ticking(el)).toHaveLength(0);
    el.disabled = true;
    await settle(el);
    expect(ticking(el)).toHaveLength(0);
  });
});
