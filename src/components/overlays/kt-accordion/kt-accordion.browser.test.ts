/** The arrows between the sections' summaries, from a real keyboard. */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture } from '#test/fixture';
import '../../../styles.css';
import './kt-accordion.js';
import '../kt-collapsible/kt-collapsible.js';
import type { KtAccordion, KtCollapsible } from 'kanto-ds';

const focusedHeading = () => {
  const section = document.activeElement as KtCollapsible | null;
  return section?.shadowRoot?.activeElement?.localName === 'summary'
    ? section.getAttribute('heading')
    : null;
};

describe('kt-accordion, from the keyboard', () => {
  it('moves between summaries on the arrows, Home and End, wrapping', async () => {
    const el = await fixture<KtAccordion>(`<kt-accordion>
      <kt-collapsible heading="Shipping">Three to five days.</kt-collapsible>
      <kt-collapsible heading="Returns">Thirty days.</kt-collapsible>
      <kt-collapsible heading="Warranty"><input aria-label="Serial number" /></kt-collapsible>
    </kt-accordion>`);
    el.querySelector<KtCollapsible>('kt-collapsible')!.focus();
    expect(focusedHeading()).toBe('Shipping');
    await userEvent.keyboard('{ArrowDown}');
    expect(focusedHeading()).toBe('Returns');
    await userEvent.keyboard('{End}');
    expect(focusedHeading()).toBe('Warranty');
    await userEvent.keyboard('{ArrowDown}');
    expect(focusedHeading()).toBe('Shipping');
    await userEvent.keyboard('{ArrowUp}');
    expect(focusedHeading()).toBe('Warranty');
    await userEvent.keyboard('{Home}');
    expect(focusedHeading()).toBe('Shipping');
  });

  it('leaves the keys alone inside a section’s content', async () => {
    const el = await fixture<KtAccordion>(`<kt-accordion>
      <kt-collapsible heading="Warranty" open><input aria-label="Serial number" /></kt-collapsible>
      <kt-collapsible heading="Returns">Thirty days.</kt-collapsible>
    </kt-accordion>`);
    const input = el.querySelector('input')!;
    input.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(document.activeElement).toBe(input);
  });
});
