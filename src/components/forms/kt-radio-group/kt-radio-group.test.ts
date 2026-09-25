import { describe, expect, it, vi } from 'vitest';
import { fixture, formFixture, settle } from '#test/fixture';
import './kt-radio-group.js';
import type { KtRadio, KtRadioGroup } from 'kanto-ds';

const MARKUP = `<kt-radio-group label="Billing" name="billing">
  <kt-radio value="monthly">Monthly</kt-radio>
  <kt-radio value="quarterly" disabled>Quarterly</kt-radio>
  <kt-radio value="yearly">Yearly</kt-radio>
</kt-radio-group>`;

const radios = (group: KtRadioGroup) => [...group.querySelectorAll<KtRadio>('kt-radio')];
const row = (radio: KtRadio) => radio.shadowRoot!.querySelector<HTMLElement>('[role="radio"]')!;

async function mount(markup = MARKUP): Promise<KtRadioGroup> {
  const group = await fixture<KtRadioGroup>(markup);
  await Promise.all(radios(group).map((radio) => settle(radio)));
  await settle(group);
  await Promise.all(radios(group).map((radio) => settle(radio)));
  return group;
}

async function press(group: KtRadioGroup, key: string, from: KtRadio) {
  row(from).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, composed: true }));
  await settle(group);
  await Promise.all(radios(group).map((radio) => settle(radio)));
}

const checked = (group: KtRadioGroup) =>
  radios(group).map((radio) => row(radio).getAttribute('aria-checked'));
const tabStops = (group: KtRadioGroup) =>
  radios(group).map((radio) => row(radio).getAttribute('tabindex'));

describe('kt-radio-group', () => {
  it('is a labelled radio group of radios', async () => {
    const group = await mount();
    const base = group.shadowRoot!.querySelector('[role="radiogroup"]')!;

    expect(base.getAttribute('aria-label')).toBe('Billing');
    expect(checked(group)).toEqual(['false', 'false', 'false']);
  });

  it('gives the group one tab stop: the first enabled option until one is chosen', async () => {
    const group = await mount();
    expect(tabStops(group)).toEqual(['0', '-1', '-1']);

    group.value = 'yearly';
    await settle(group);
    await Promise.all(radios(group).map((radio) => settle(radio)));
    expect(tabStops(group)).toEqual(['-1', '-1', '0']);
  });

  it('selects on click and reports it', async () => {
    const group = await mount();
    const changed = vi.fn();
    group.addEventListener('kt-change', changed);

    row(radios(group)[2]!).click();
    await settle(group);
    await Promise.all(radios(group).map((radio) => settle(radio)));

    expect(group.value).toBe('yearly');
    expect(checked(group)).toEqual(['false', 'false', 'true']);
    expect((changed.mock.calls[0]![0] as CustomEvent).detail).toEqual({ value: 'yearly' });
  });

  it('ignores a disabled option', async () => {
    const group = await mount();
    row(radios(group)[1]!).click();
    await settle(group);
    expect(group.value).toBeNull();
  });

  it('moves and selects with the arrows, skipping disabled options and wrapping', async () => {
    const group = await mount();
    const [monthly, , yearly] = radios(group);

    await press(group, 'ArrowDown', monthly!);
    expect(group.value).toBe('yearly');

    await press(group, 'ArrowDown', yearly!);
    expect(group.value).toBe('monthly');

    await press(group, 'ArrowUp', monthly!);
    expect(group.value).toBe('yearly');
  });

  it('selects the focused option with Space', async () => {
    const group = await mount();
    await press(group, ' ', radios(group)[0]!);
    expect(group.value).toBe('monthly');
  });

  it('takes no input and no tab stop while disabled', async () => {
    const group = await mount(MARKUP.replace('<kt-radio-group ', '<kt-radio-group disabled '));

    expect(tabStops(group)).toEqual(['-1', '-1', '-1']);
    expect(
      radios(group).every((radio) => row(radio).getAttribute('aria-disabled') === 'true'),
    ).toBe(true);

    row(radios(group)[0]!).click();
    await settle(group);
    expect(group.value).toBeNull();
  });
});

describe('kt-radio-group in a form', () => {
  it('is a form-associated element', () => {
    expect(customElements.get('kt-radio-group')).toHaveProperty('formAssociated', true);
  });

  it('submits the chosen value, and nothing while empty', async () => {
    const { element, internals } = await formFixture<KtRadioGroup>(MARKUP);
    expect(internals.setFormValue).toHaveBeenLastCalledWith(null);

    element.value = 'monthly';
    await settle(element);
    expect(internals.setFormValue).toHaveBeenLastCalledWith('monthly');
  });

  it('reports a missing choice while required', async () => {
    const { element, internals } = await formFixture<KtRadioGroup>(
      MARKUP.replace('<kt-radio-group ', '<kt-radio-group required '),
    );
    expect(internals.setValidity).toHaveBeenLastCalledWith(
      { valueMissing: true, customError: false },
      'Select an option.',
      undefined,
    );

    element.value = 'yearly';
    await settle(element);
    expect(internals.setValidity).toHaveBeenLastCalledWith({});
  });

  it('returns to its initial value on form reset', async () => {
    const group = await mount(
      MARKUP.replace('<kt-radio-group ', '<kt-radio-group value="yearly" '),
    );
    group.value = 'monthly';
    await settle(group);

    group.formResetCallback();
    await settle(group);

    expect(group.value).toBe('yearly');
  });

  it('describes itself with its error and marks the options', async () => {
    const group = await mount(
      MARKUP.replace('<kt-radio-group ', '<kt-radio-group error="Choose a plan" '),
    );
    const base = group.shadowRoot!.querySelector('[role="radiogroup"]')!;
    const id = base.getAttribute('aria-describedby')!;

    expect(base.getAttribute('aria-invalid')).toBe('true');
    expect(group.shadowRoot!.getElementById(id)!.textContent).toBe('Choose a plan');
    expect(radios(group).every((radio) => radio.invalid)).toBe(true);
  });
});
