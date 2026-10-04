import { describe, expect, it, vi } from 'vitest';
import { fixture } from '#test/fixture';
import './kt-pricing-table.js';
import type { KtPricingTable, KtPlan } from 'kanto-ds';

const root = (el: KtPricingTable) => el.shadowRoot!;

const PLANS: KtPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For one person.',
    price: { monthly: 0, yearly: 0 },
    features: ['10 invoices a month', 'Email reminders'],
  },
  {
    id: 'team',
    name: 'Team',
    description: 'For a team that bills.',
    price: { monthly: 29, yearly: 290 },
    features: ['Unlimited invoices', 'Bank reconciliation'],
    featured: true,
    action: 'Start a trial',
  },
  {
    id: 'scale',
    name: 'Scale',
    price: { monthly: 'Custom', yearly: 'Custom' },
    features: ['SSO'],
    href: '/sales',
    action: 'Talk to sales',
  },
];

async function table(markup = '<kt-pricing-table heading="Pricing"></kt-pricing-table>') {
  const el = await fixture<KtPricingTable>(markup);
  el.plans = PLANS;
  await el.updateComplete;
  return el;
}

const plans = (el: KtPricingTable) => [...root(el).querySelectorAll<HTMLElement>('.plans > li')];
const price = (plan: HTMLElement) =>
  plan.querySelector('.price')!.textContent!.replace(/\s+/g, ' ').trim();

describe('kt-pricing-table', () => {
  it('is a section named by its heading, each plan a list item with its name a level under', async () => {
    const el = await table();
    const section = root(el).querySelector('section')!;
    const label = root(el).getElementById(section.getAttribute('aria-labelledby')!)!;
    expect(label.textContent!.trim()).toBe('Pricing');
    expect(plans(el)).toHaveLength(3);
    expect(plans(el)[1]!.querySelector('h3')!.textContent!.trim()).toBe('Team');
    expect(plans(el)[1]!.querySelector('.plan-description')!.textContent).toBe(
      'For a team that bills.',
    );
  });

  it('lists what each plan includes', async () => {
    const el = await table();
    const items = [...plans(el)[1]!.querySelectorAll('.features li')].map((li) =>
      li.textContent!.trim(),
    );
    expect(items).toEqual(['Unlimited invoices', 'Bank reconciliation']);
  });

  it('shows the monthly prices, formatted, and a written price as written', async () => {
    const el = await table('<kt-pricing-table locale="en-US"></kt-pricing-table>');
    expect(price(plans(el)[1]!)).toContain('$29');
    expect(price(plans(el)[1]!)).toContain('/month');
    expect(price(plans(el)[2]!)).toBe('Custom');
  });

  it('takes a currency', async () => {
    const el = await table('<kt-pricing-table locale="en-US" currency="EUR"></kt-pricing-table>');
    expect(price(plans(el)[1]!)).toContain('€29');
  });

  it('switches to the yearly prices, and says so', async () => {
    const el = await table('<kt-pricing-table locale="en-US"></kt-pricing-table>');
    const changed = vi.fn();
    el.addEventListener('kt-billing', (event) => changed((event as CustomEvent).detail));
    const control = root(el).querySelector('kt-segmented-control')!;
    control.dispatchEvent(
      new CustomEvent('kt-change', { detail: { value: 'yearly' }, bubbles: true, composed: true }),
    );
    await el.updateComplete;
    expect(el.billing).toBe('yearly');
    expect(el.getAttribute('billing')).toBe('yearly');
    expect(price(plans(el)[1]!)).toContain('$290');
    expect(price(plans(el)[1]!)).toContain('/year');
    expect(changed).toHaveBeenCalledWith({ billing: 'yearly' });
  });

  it('has no billing switch when every plan has one price', async () => {
    const el = await fixture<KtPricingTable>('<kt-pricing-table></kt-pricing-table>');
    el.plans = [{ id: 'one', name: 'One', price: 9, features: [] }];
    await el.updateComplete;
    expect(root(el).querySelector('kt-segmented-control')).toBeNull();
    expect(price(plans(el)[0]!)).toContain('9');
  });

  it('marks the featured plan with a badge', async () => {
    const el = await table();
    expect(plans(el)[1]!.classList.contains('featured')).toBe(true);
    expect(plans(el)[1]!.querySelector('.badge')!.textContent!.trim()).toBe('Most popular');
    expect(plans(el)[0]!.querySelector('.badge')).toBeNull();
  });

  it('fires kt-plan from a plan without an href, and links one with', async () => {
    const el = await table();
    const chosen = vi.fn();
    el.addEventListener('kt-plan', (event) => chosen((event as CustomEvent).detail));
    const button = plans(el)[1]!.querySelector('kt-button')!;
    expect(button.textContent!.trim()).toBe('Start a trial');
    button.click();
    expect(chosen).toHaveBeenCalledWith({ id: 'team', billing: 'monthly' });
    const link = plans(el)[2]!.querySelector('a.action')!;
    expect(link.getAttribute('href')).toBe('/sales');
    expect(plans(el)[0]!.querySelector('kt-button')!.textContent!.trim()).toBe('Get started');
  });

  it('takes its words in texts', async () => {
    const el = await table();
    el.texts = { featured: 'Le plus choisi', perMonth: '/mois' };
    await el.updateComplete;
    expect(plans(el)[1]!.querySelector('.badge')!.textContent!.trim()).toBe('Le plus choisi');
    expect(price(plans(el)[1]!)).toContain('/mois');
  });
});
