import type { Template } from './index.js';

export const pricing: Template = {
  slug: 'pricing',
  name: 'Pricing',
  description: 'Three plans, monthly or yearly, and a seat count that prices the team.',
  html: `<style>
  .pricing {
    display: grid;
    align-content: start;
    gap: 32px;
    justify-items: center;
    min-height: 100vh;
    padding: 56px 24px;
    background: var(--surface-page);
  }
  .pricing h1 {
    margin: 0;
    color: var(--text-body);
    font: var(--font-title-h1);
    text-align: center;
  }
  .pricing > p {
    margin: -20px 0 0;
    color: var(--text-muted);
    font: var(--font-normal-regular);
  }
  .pricing-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
    justify-content: center;
  }
  .pricing-seats-row {
    display: flex;
    gap: 10px;
    align-items: center;
    color: var(--text-body);
    font: var(--font-normal-regular);
  }
  .pricing-seats {
    width: 150px;
  }
  .plans {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    width: min(960px, 100%);
  }
  .plan {
    display: grid;
    gap: 16px;
    align-content: start;
    padding: 28px;
    background: var(--surface-card);
    border: var(--border-width) solid var(--border-subtle);
    border-radius: var(--radius-modal);
  }
  .plan.featured {
    border-color: var(--color-primary-base);
    box-shadow: 0 0 0 1px var(--color-primary-base);
  }
  .plan h2 {
    display: flex;
    gap: 8px;
    align-items: center;
    margin: 0;
    color: var(--text-body);
    font: var(--font-title-h6);
  }
  .plan-price {
    color: var(--text-body);
    font: var(--font-title-h4);
  }
  .plan-price small {
    color: var(--text-muted);
    font: var(--font-normal-small);
  }
  .plan ul {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
    color: var(--text-muted);
    font: var(--font-normal-regular);
    list-style: none;
  }
  .plan li::before {
    margin-right: 8px;
    color: var(--color-success-text);
    content: '✓';
  }
</style>

<main class="pricing">
  <h1>Simple pricing, per seat</h1>
  <p>Every plan has every component. You pay for support and scale.</p>

  <div class="pricing-controls">
    <kt-segmented-control id="period" label="Billing period"></kt-segmented-control>
    <label class="pricing-seats-row">
      Seats
      <kt-number-input class="pricing-seats" id="seats" label="Seats" min="1" max="500" value="10"></kt-number-input>
    </label>
  </div>

  <div class="plans">
    <article class="plan" data-plan="starter">
      <h2>Starter</h2>
      <div class="plan-price"></div>
      <ul><li>Up to 5 seats</li><li>Community support</li><li>Every component</li></ul>
      <kt-button variant="secondary" data-choose>Start free</kt-button>
    </article>
    <article class="plan featured" data-plan="team">
      <h2>Team <kt-badge tone="primary">Popular</kt-badge></h2>
      <div class="plan-price"></div>
      <ul><li>Unlimited seats</li><li>Priority support</li><li>Audit log</li></ul>
      <kt-button variant="primary" data-choose>Choose Team</kt-button>
    </article>
    <article class="plan" data-plan="enterprise">
      <h2>Enterprise</h2>
      <div class="plan-price"></div>
      <ul><li>Single sign-on</li><li>Data residency</li><li>A named contact</li></ul>
      <kt-button variant="secondary" data-choose>Talk to us</kt-button>
    </article>
  </div>
</main>`,
  script: `import { toaster } from 'kanto-ds';

const PER_SEAT = { starter: 0, team: 12, enterprise: 24 };
const period = document.querySelector('#period');
const seats = document.querySelector('#seats');

period.options = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly, two months free' },
];
period.value = 'monthly';

function price() {
  const yearly = period.value === 'yearly';
  for (const plan of document.querySelectorAll('[data-plan]')) {
    const perSeat = PER_SEAT[plan.dataset.plan];
    const monthly = perSeat * (seats.value ?? 1) * (yearly ? 10 / 12 : 1);
    plan.querySelector('.plan-price').innerHTML = perSeat
      ? \`$\${Math.round(monthly).toLocaleString('en-US')} <small>a month, \${yearly ? 'billed yearly' : 'billed monthly'}</small>\`
      : 'Free <small>for small teams</small>';
  }
}

period.addEventListener('kt-change', price);
seats.addEventListener('kt-change', price);
for (const button of document.querySelectorAll('[data-choose]')) {
  button.addEventListener('click', () => toaster.success(\`\${button.textContent.trim()} — good choice\`));
}
price();`,
};
