import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '../../../test/fixture.js';
import './kt-form.js';
import '../kt-input/kt-input.js';
import '../kt-label-input/kt-label-input.js';
import '../../core/kt-button/kt-button.js';
import type { KtForm } from './kt-form.js';
import type { KtInput } from '../kt-input/kt-input.js';

const fieldset = (el: KtForm) => el.shadowRoot!.querySelector('fieldset')!;
const legend = (el: KtForm) => el.shadowRoot!.querySelector('legend')!;
const footer = (el: KtForm) => el.shadowRoot!.querySelector('.footer')!;

const mount = (attrs = '', body = '<kt-input name="company"></kt-input>') =>
  fixture<KtForm>(`<kt-form ${attrs}>${body}</kt-form>`);

describe('kt-form', () => {
  it('is a fieldset, so the group has a name in the accessibility tree', async () => {
    const el = await mount('heading="Identity"');
    expect(fieldset(el)).not.toBeNull();
    expect(legend(el).textContent).toContain('Identity');
    expect(legend(el).classList.contains('visually-hidden')).toBe(false);
  });

  it('keeps a legend even with no heading, hidden rather than absent', async () => {
    const el = await mount();
    expect(legend(el).classList.contains('visually-hidden')).toBe(true);
  });

  it('shows the description only when there is one', async () => {
    const plain = await mount('heading="Identity"');
    expect(plain.shadowRoot!.querySelector('.description')).toBeNull();

    const described = await mount('heading="Identity" description="How we address you."');
    expect(described.shadowRoot!.querySelector('.description')!.textContent).toContain(
      'How we address you.',
    );
  });

  it('collapses the footer when nothing is slotted into it', async () => {
    const bare = await mount();
    expect(footer(bare).classList.contains('empty')).toBe(true);

    const withActions = await mount('', '<kt-button slot="footer">Save</kt-button>');
    await settle(withActions);
    expect(footer(withActions).classList.contains('empty')).toBe(false);
  });

  it('replaces the fields with placeholders while loading, without unmounting them', async () => {
    const el = await mount('loading loading-fields="2"');
    expect(el.shadowRoot!.querySelectorAll('.placeholder')).toHaveLength(2);
    // The real field is still there, so its value survives the load.
    expect(el.querySelector('kt-input')).not.toBeNull();

    el.loading = false;
    await settle(el);
    expect(el.shadowRoot!.querySelectorAll('.placeholder')).toHaveLength(0);
  });

  it('switches off every slotted field, which a fieldset cannot do across a shadow root', async () => {
    const el = await mount(
      '',
      '<kt-label-input label="Company"><kt-input name="company"></kt-input></kt-label-input>',
    );
    const input = el.querySelector<KtInput>('kt-input')!;
    await settle(input);
    expect(input.disabled).toBe(false);

    el.disabled = true;
    await settle(el);
    expect(input.disabled).toBe(true);

    el.disabled = false;
    await settle(el);
    expect(input.disabled).toBe(false);
  });

  it('leaves submission to the form above it', async () => {
    const form = await fixture<HTMLFormElement>(
      '<form><kt-form><kt-input name="company" value="Kanto"></kt-input></kt-form>' +
        '<kt-button type="submit">Save</kt-button></form>',
    );
    const submitted = vi.fn((e: Event) => e.preventDefault());
    form.addEventListener('submit', submitted);

    for (const el of form.querySelectorAll('kt-form, kt-input, kt-button')) await settle(el);
    const button = form.querySelector('kt-button')!;
    button.shadowRoot!.querySelector('button')!.click();

    expect(submitted).toHaveBeenCalledOnce();
  });
});
