/** The plans side by side where they fit, and the switch by keyboard. */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture } from '#test/fixture';
import '../../../styles.css';
import './kt-pricing-table.js';
import type { KtPricingTable } from 'kanto-ds';

async function mount(width: number) {
  const el = await fixture<KtPricingTable>(
    `<kt-pricing-table heading="Pricing" locale="en-US" style="width: ${width}px"></kt-pricing-table>`,
  );
  el.plans = ['Starter', 'Team', 'Scale'].map((name, n) => ({
    id: name.toLowerCase(),
    name,
    price: { monthly: n * 10, yearly: n * 100 },
    features: ['Invoices'],
  }));
  await el.updateComplete;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return el;
}

const plans = (el: KtPricingTable) =>
  [...el.shadowRoot!.querySelectorAll('.plans > li')].map((li) => li.getBoundingClientRect());

describe('kt-pricing-table, laid out', () => {
  it('sets the plans side by side when wide, stacked when narrow', async () => {
    const [a, b, c] = plans(await mount(1000));
    expect(b!.top).toBe(a!.top);
    expect(c!.left).toBeGreaterThan(b!.right);
    const [d, e] = plans(await mount(360));
    expect(e!.top).toBeGreaterThanOrEqual(d!.bottom);
  });

  it('switches to yearly from the keyboard', async () => {
    const el = await mount(1000);
    const monthly = el
      .shadowRoot!.querySelector('kt-segmented-control')!
      .shadowRoot!.querySelector<HTMLElement>('[role="radio"][aria-checked="true"]')!;
    monthly.focus();
    await userEvent.keyboard('{ArrowRight}');
    await el.updateComplete;
    expect(el.billing).toBe('yearly');
    expect(el.shadowRoot!.querySelectorAll('.price')[1]!.textContent).toContain('/year');
  });
});
