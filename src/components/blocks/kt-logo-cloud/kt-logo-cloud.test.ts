import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import './kt-logo-cloud.js';
import type { KtLogoCloud } from 'kanto-ds';

const root = (el: KtLogoCloud) => el.shadowRoot!;

describe('kt-logo-cloud', () => {
  it('is a section named by its heading, an h2 set as a caption', async () => {
    const el = await fixture<KtLogoCloud>(
      '<kt-logo-cloud heading="Trusted by finance teams at"><img alt="Northwind" /></kt-logo-cloud>',
    );
    const section = root(el).querySelector('section')!;
    const label = root(el).getElementById(section.getAttribute('aria-labelledby')!)!;
    expect(label.textContent!.trim()).toBe('Trusted by finance teams at');
    expect(root(el).querySelector('h2.caption')).not.toBeNull();
  });

  it('takes its logos in the default slot', async () => {
    const el = await fixture<KtLogoCloud>(
      '<kt-logo-cloud><img alt="Northwind" /><img alt="Kiln" /></kt-logo-cloud>',
    );
    const slot = root(el).querySelector<HTMLSlotElement>('.logos slot:not([name])')!;
    expect(slot.assignedElements()).toHaveLength(2);
  });

  it('greys its logos by default, and keeps their colours with colour', async () => {
    const el = await fixture<KtLogoCloud>('<kt-logo-cloud></kt-logo-cloud>');
    expect(el.hasAttribute('colour')).toBe(false);
    el.colour = true;
    await el.updateComplete;
    expect(el.hasAttribute('colour')).toBe(true);
  });

  it('is unnamed without a heading', async () => {
    const el = await fixture<KtLogoCloud>('<kt-logo-cloud></kt-logo-cloud>');
    expect(root(el).querySelector('section')!.hasAttribute('aria-labelledby')).toBe(false);
    expect(root(el).querySelector('h2')).toBeNull();
  });
});
