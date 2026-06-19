import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '../../test/fixture.js';
import './kt-label-input.js';
import './kt-input.js';
import type { KtLabelInput } from './kt-label-input.js';
import type { KtInput } from './kt-input.js';

const labelEl = (el: KtLabelInput) => el.shadowRoot!.querySelector('label')!;

describe('kt-label-input', () => {
  it('renders the label text', async () => {
    const el = await fixture<KtLabelInput>(
      '<kt-label-input label="Nom"><kt-input></kt-input></kt-label-input>',
    );
    expect(labelEl(el).textContent).toContain('Nom');
    expect(labelEl(el).querySelector('.required')).toBeNull();
  });

  it('marks required fields with an asterisk hidden from screen readers', async () => {
    const el = await fixture<KtLabelInput>(
      '<kt-label-input label="Nom" required><kt-input></kt-input></kt-label-input>',
    );
    const star = labelEl(el).querySelector('.required')!;
    expect(star.textContent).toBe('*');
    expect(star.getAttribute('aria-hidden')).toBe('true');
  });

  it('names the slotted control, since label association cannot cross a shadow root', async () => {
    const el = await fixture<KtLabelInput>(
      '<kt-label-input label="Adresse e-mail"><kt-input></kt-input></kt-label-input>',
    );
    const input = el.querySelector<KtInput>('kt-input')!;
    await settle(input);

    expect(input.label).toBe('Adresse e-mail');
    expect(input.shadowRoot!.querySelector('input')!.getAttribute('aria-label')).toBe(
      'Adresse e-mail',
    );
  });

  it('falls back to aria-label for a control with no label property', async () => {
    const el = await fixture<KtLabelInput>(
      '<kt-label-input label="Notes"><textarea></textarea></kt-label-input>',
    );
    expect(el.querySelector('textarea')!.getAttribute('aria-label')).toBe('Notes');
  });

  it('focuses the control when the label is clicked', async () => {
    const el = await fixture<KtLabelInput>(
      '<kt-label-input label="Nom"><kt-input></kt-input></kt-label-input>',
    );
    const input = el.querySelector<KtInput>('kt-input')!;
    const focus = vi.spyOn(input, 'focus');

    labelEl(el).click();
    expect(focus).toHaveBeenCalledOnce();
  });
});
