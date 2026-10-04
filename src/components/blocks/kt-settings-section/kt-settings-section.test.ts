import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import './kt-settings-section.js';
import type { KtSettingsSection } from 'kanto-ds';

const root = (el: KtSettingsSection) => el.shadowRoot!;

describe('kt-settings-section', () => {
  it('is a section named by its heading, an h2, described by its description', async () => {
    const el = await fixture<KtSettingsSection>(
      '<kt-settings-section heading="Profile" description="How others see you."></kt-settings-section>',
    );
    const section = root(el).querySelector('section')!;
    const label = root(el).getElementById(section.getAttribute('aria-labelledby')!)!;
    expect(label.textContent!.trim()).toBe('Profile');
    expect(root(el).querySelector('h2')).not.toBeNull();
    const described = root(el).getElementById(section.getAttribute('aria-describedby')!)!;
    expect(described.textContent!.trim()).toBe('How others see you.');
  });

  it('has no description reference without a description', async () => {
    const el = await fixture<KtSettingsSection>(
      '<kt-settings-section heading="x"></kt-settings-section>',
    );
    expect(root(el).querySelector('section')!.hasAttribute('aria-describedby')).toBe(false);
  });

  it('takes its fields in the default slot, and a footer only when given actions or a note', async () => {
    const el = await fixture<KtSettingsSection>(
      '<kt-settings-section heading="x"><input aria-label="Name" /></kt-settings-section>',
    );
    const fields = root(el).querySelector<HTMLSlotElement>('.fields slot:not([name])')!;
    expect(fields.assignedElements()).toHaveLength(1);
    expect(root(el).querySelector('.footer')!.classList.contains('empty')).toBe(true);
    const withActions = await fixture<KtSettingsSection>(
      '<kt-settings-section heading="x"><button slot="actions">Save</button></kt-settings-section>',
    );
    expect(root(withActions).querySelector('.footer')!.classList.contains('empty')).toBe(false);
  });

  it('is split by default, and marks a danger zone', async () => {
    const el = await fixture<KtSettingsSection>(
      '<kt-settings-section heading="x"></kt-settings-section>',
    );
    expect(el.getAttribute('layout')).toBe('split');
    expect(el.hasAttribute('danger')).toBe(false);
    el.danger = true;
    el.layout = 'stacked';
    await el.updateComplete;
    expect(el.hasAttribute('danger')).toBe(true);
    expect(el.getAttribute('layout')).toBe('stacked');
  });
});
