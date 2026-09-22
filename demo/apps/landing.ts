import { html, type TemplateResult } from 'lit';
import { toaster } from 'kanto';
import { rerender } from '../lib/render.js';
import { MONTHS, monthlyRevenue } from '../lib/data.js';

/**
 * A marketing page.
 *
 * Different work from an admin screen — long measure, generous rhythm, one
 * message per band — and a useful stress test: a design system built for
 * data-dense tools should still be able to say hello.
 */

const state = { plan: 'annual' as 'monthly' | 'annual', email: '', submitted: false };

const PRICING = {
  monthly: [
    {
      name: 'Starter',
      price: '$0',
      note: 'For trying it out',
      features: ['1 workspace', '2 members', 'Community support'],
    },
    {
      name: 'Pro',
      price: '$24',
      note: 'Per member, per month',
      features: ['Unlimited workspaces', 'Priority support', 'Audit log'],
      featured: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      note: 'Talk to us',
      features: ['SSO and SCIM', 'Data residency', 'A named contact'],
    },
  ],
  annual: [
    {
      name: 'Starter',
      price: '$0',
      note: 'For trying it out',
      features: ['1 workspace', '2 members', 'Community support'],
    },
    {
      name: 'Pro',
      price: '$19',
      note: 'Per member, per month, billed yearly',
      features: ['Unlimited workspaces', 'Priority support', 'Audit log'],
      featured: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      note: 'Talk to us',
      features: ['SSO and SCIM', 'Data residency', 'A named contact'],
    },
  ],
};

const FEATURES = [
  {
    icon: 'component',
    title: 'Thirty elements',
    body: 'Buttons through tables, each one a standard custom element with its own tests and page.',
  },
  {
    icon: 'palette',
    title: 'One token layer',
    body: 'Every decision resolves to a custom property, so the light theme costs no component CSS.',
  },
  {
    icon: 'accessibility',
    title: 'Keyboard first',
    body: 'Real listboxes, real tablists, native dialogs. Everything a pointer can do, a keyboard can.',
  },
  {
    icon: 'zap',
    title: 'No framework',
    body: 'React, Vue, Angular, Svelte or none. One implementation, one place a fix lands.',
  },
];

const FAQ = [
  [
    'Does it work with my framework?',
    'They are custom elements, so yes — React, Vue, Angular, Svelte, or plain HTML. Typed wrappers ship for React and Vue.',
  ],
  [
    'How big is it?',
    'Import one element and your bundler drops the rest. The whole set with the token layer is a few tens of kilobytes.',
  ],
  [
    'Can I theme it?',
    'Redefine tokens on :root. Dark is canonical, light is opt-in, and no component carries theme-specific CSS.',
  ],
  [
    'Is server rendering supported?',
    'The markup renders present but unstyled until the bundle upgrades the elements. The token layer can be served from the first byte.',
  ],
];

export function landingPage(): TemplateResult {
  const plans = PRICING[state.plan];

  return html`<div class="landing">
    <kt-header sticky class="landing-header">
      <a slot="brand" class="wordmark" href="#/app/landing">KANTO <span>DS</span></a>
      <nav class="landing-nav">
        <a href="#/app/landing">Features</a>
        <a href="#/app/landing">Pricing</a>
        <a href="#/guide/introduction">Docs</a>
      </nav>
      <div slot="actions" class="row">
        <kt-button
          size="small"
          variant="secondary-no-bg"
          @click=${() => (location.hash = '#/app/console/home')}
          >Sign in</kt-button
        >
        <kt-button
          size="small"
          icon="arrow-right"
          icon-position="right"
          @click=${() => (location.hash = '#/app/console/home')}
          >Open the console</kt-button
        >
      </div>
    </kt-header>

    <section class="hero">
      <kt-badge variant="primary" pill>v1.0 is out</kt-badge>
      <h1>A design system for tools people work in all day</h1>
      <p>
        Dark-first, data-dense, and framework-agnostic. Thirty custom elements that run anywhere,
        built on one token layer that makes the light theme free.
      </p>
      <div class="row" style="justify-content:center">
        <kt-button
          size="large"
          icon="arrow-right"
          icon-position="right"
          @click=${() => (location.hash = '#/app/console/home')}
          >See the console</kt-button
        >
        <kt-button
          size="large"
          variant="dark"
          icon="book-open"
          @click=${() => (location.hash = '#/guide/introduction')}
          >Read the docs</kt-button
        >
      </div>
      <span class="row" style="justify-content:center;gap:8px">
        <kt-kbd keys="mod k"></kt-kbd>
        <span class="muted" style="font:var(--font-normal-small)">to search the documentation</span>
      </span>
    </section>

    <section class="band">
      <kt-card class="hero-preview">
        <div slot="header" class="row" style="justify-content:space-between">
          <div>
            <div class="overline">Revenue</div>
            <div style="font:var(--font-title-h4)">$292,342</div>
          </div>
          <kt-badge variant="success">+12% this quarter</kt-badge>
        </div>
        <kt-chart
          type="area"
          height="200"
          smooth
          label="Revenue by month"
          .labels=${MONTHS}
          .series=${[{ name: 'Revenue', values: monthlyRevenue(11) }]}
          .format=${(n: number) => `$${(n * 220).toLocaleString('en-US')}`}
        ></kt-chart>
      </kt-card>
    </section>

    <section class="band">
      <h2>What you get</h2>
      <div class="feature-grid">
        ${FEATURES.map(
          (feature) =>
            html`<kt-card>
              <span slot="header" class="feature-icon"
                ><kt-icon name=${feature.icon} size="20"></kt-icon
              ></span>
              <h6>${feature.title}</h6>
              <p class="muted">${feature.body}</p>
            </kt-card>`,
        )}
      </div>
    </section>

    <section class="band">
      <h2>Pricing</h2>
      <div class="row" style="justify-content:center;margin-bottom:24px">
        <kt-segmented-control
          label="Billing period"
          .value=${state.plan}
          .options=${[
            { value: 'monthly', label: 'Monthly' },
            { value: 'annual', label: 'Annual — save 20%' },
          ]}
          @kt-change=${(e: CustomEvent<{ value: 'monthly' | 'annual' }>) => {
            state.plan = e.detail.value;
            rerender();
          }}
        ></kt-segmented-control>
      </div>

      <div class="pricing-grid">
        ${plans.map(
          (plan) =>
            html`<kt-card ?selected=${Boolean(plan.featured)}>
              <div slot="header" class="row" style="justify-content:space-between">
                <h6>${plan.name}</h6>
                ${plan.featured ? html`<kt-badge variant="primary">Most popular</kt-badge>` : ''}
              </div>
              <div style="font:var(--font-title-h1);line-height:1.1">${plan.price}</div>
              <span class="muted" style="font:var(--font-normal-small)">${plan.note}</span>
              <ul class="feature-list">
                ${plan.features.map(
                  (feature) =>
                    html`<li>
                      <kt-icon
                        name="check"
                        size="16"
                        style="color:var(--color-success-base)"
                      ></kt-icon>
                      ${feature}
                    </li>`,
                )}
              </ul>
              <kt-button
                slot="footer"
                full-width
                variant=${plan.featured ? 'primary' : 'dark'}
                @click=${() => toaster.info(`${plan.name} selected`)}
                >${plan.price === 'Custom' ? 'Contact sales' : 'Choose ' + plan.name}</kt-button
              >
            </kt-card>`,
        )}
      </div>
    </section>

    <section class="band">
      <h2>Questions</h2>
      <div class="faq">
        ${FAQ.map(
          ([question, answer], index) =>
            html`<kt-collapsible heading=${question} ?open=${index === 0}>
              ${answer}
            </kt-collapsible>`,
        )}
      </div>
    </section>

    <section class="band cta">
      <kt-card>
        <h2 style="margin:0">Start with the console</h2>
        <p class="muted">
          Every screen in it is built from the elements on this page. Nothing is a mockup.
        </p>
        <form
          class="row"
          style="justify-content:center;margin-top:8px"
          @submit=${(e: SubmitEvent) => {
            e.preventDefault();
            state.submitted = true;
            rerender();
            toaster.success('Thanks — nothing was actually sent.');
          }}
        >
          <kt-input
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            style="width:280px"
            @kt-input=${(e: CustomEvent<{ value: string }>) => {
              state.email = e.detail.value;
            }}
          ></kt-input>
          <kt-button type="submit" icon="arrow-right" icon-position="right">Get started</kt-button>
        </form>
        ${
          state.submitted
            ? html`<kt-alert
                variant="success"
                description="This form is a demonstration — the address goes nowhere."
                style="margin-top:16px"
              ></kt-alert>`
            : ''
        }
      </kt-card>
    </section>

    <footer class="landing-footer">
      <span class="muted">Kanto · a design system for data-dense product interfaces</span>
      <a href="#/guide/introduction">Documentation</a>
    </footer>
  </div>`;
}
