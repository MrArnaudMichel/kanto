/**
 * Checkbox and radio group driven the way a person drives them: real clicks,
 * real Tab and arrow presses, real focus — none of which a simulated DOM
 * reproduces faithfully.
 */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../../styles.css';
import './kt-checkbox/kt-checkbox.js';
import './kt-radio-group/kt-radio-group.js';
import type { KtCheckbox, KtRadio, KtRadioGroup } from 'kanto-ds';

/** The element that has focus, looking through shadow roots. */
function deepActive(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

describe('kt-checkbox, for real', () => {
  it('toggles from a click on its label text', async () => {
    const el = await fixture<KtCheckbox>('<kt-checkbox>Send me updates</kt-checkbox>');

    await userEvent.click(el.shadowRoot!.querySelector('.text')!);
    await settle(el);

    expect(el.checked).toBe(true);
  });

  it('toggles with Space once focused by Tab', async () => {
    const el = await fixture<KtCheckbox>('<kt-checkbox>Send me updates</kt-checkbox>');

    await userEvent.tab();
    expect(deepActive()).toBe(el.shadowRoot!.querySelector('input'));
    await userEvent.keyboard(' ');
    await settle(el);

    expect(el.checked).toBe(true);
  });
});

describe('kt-radio-group, for real', () => {
  const MARKUP = `<kt-radio-group label="Billing" value="yearly">
    <kt-radio value="monthly">Monthly</kt-radio>
    <kt-radio value="custom" disabled>Custom</kt-radio>
    <kt-radio value="yearly">Yearly</kt-radio>
  </kt-radio-group>`;

  const row = (radio: KtRadio) => radio.shadowRoot!.querySelector('[role="radio"]');

  it('takes one Tab to enter, landing on the chosen option, and one to leave', async () => {
    const group = await fixture<KtRadioGroup>(`<div>${MARKUP}<button>After</button></div>`);
    const radios = [...group.querySelectorAll<KtRadio>('kt-radio')];
    await settle(group.querySelector('kt-radio-group'));

    await userEvent.tab();
    expect(deepActive()).toBe(row(radios[2]!));

    await userEvent.tab();
    expect(deepActive()).toBe(group.querySelector('button'));
  });

  it('moves focus and selection together with the arrows, over the disabled option', async () => {
    const group = await fixture<KtRadioGroup>(MARKUP);
    const radios = [...group.querySelectorAll<KtRadio>('kt-radio')];
    await settle(group);

    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    await settle(group);

    expect(group.value).toBe('monthly');
    expect(deepActive()).toBe(row(radios[0]!));
  });
});
