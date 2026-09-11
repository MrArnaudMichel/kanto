import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-label-input.js';
import '../kt-input/kt-input.js';
import type { KtLabelInput } from 'kanto-ds';
import type { KtInput } from 'kanto-ds';

const labelEl = (el: KtLabelInput) => el.shadowRoot!.querySelector('label')!;

describe('kt-label-input', () => {
  it('renders the label text', async () => {
    const el = await fixture<KtLabelInput>(
      '<kt-label-input label="Name"><kt-input></kt-input></kt-label-input>',
    );
    expect(labelEl(el).textContent).toContain('Name');
    expect(labelEl(el).querySelector('.required')).toBeNull();
  });

  it('marks required fields with an asterisk hidden from screen readers', async () => {
    const el = await fixture<KtLabelInput>(
      '<kt-label-input label="Name" required><kt-input></kt-input></kt-label-input>',
    );
    const star = labelEl(el).querySelector('.required')!;
    expect(star.textContent).toBe('*');
    expect(star.getAttribute('aria-hidden')).toBe('true');
  });

  it('names the slotted control, since label association cannot cross a shadow root', async () => {
    const el = await fixture<KtLabelInput>(
      '<kt-label-input label="Email address"><kt-input></kt-input></kt-label-input>',
    );
    const input = el.querySelector<KtInput>('kt-input')!;
    await settle(input);

    expect(input.label).toBe('Email address');
    expect(input.shadowRoot!.querySelector('input')!.getAttribute('aria-label')).toBe(
      'Email address',
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
      '<kt-label-input label="Name"><kt-input></kt-input></kt-label-input>',
    );
    const input = el.querySelector<KtInput>('kt-input')!;
    const focus = vi.spyOn(input, 'focus');

    labelEl(el).click();
    expect(focus).toHaveBeenCalledOnce();
  });
});
