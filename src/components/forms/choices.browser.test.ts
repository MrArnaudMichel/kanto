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

describe('kt-radio, drawn', () => {
  it('centres its dot in its circle, on whole pixels', async () => {
    // Placed by percentage, the dot came out 8.97px wide and 3.52px in, and
    // each browser rounded the halves its own way: off-centre in Firefox.
    const radio = await fixture<KtRadio>('<kt-radio value="a" checked>Yearly</kt-radio>');
    await settle(radio);
    const circle = radio.shadowRoot!.querySelector('.circle')!.getBoundingClientRect();
    const dot = radio.shadowRoot!.querySelector('.dot')!.getBoundingClientRect();

    expect(dot.left - circle.left).toBe(circle.right - dot.right);
    expect(dot.top - circle.top).toBe(circle.bottom - dot.bottom);
    expect(Number.isInteger(dot.width)).toBe(true);
    expect(Number.isInteger(dot.left - circle.left)).toBe(true);
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
