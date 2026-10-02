import { html, type TemplateResult } from 'lit';

const SURFACES = [8, 12, 14, 15, 16, 18, 19, 20, 22, 23, 24];
const SEMANTIC = ['primary', 'danger', 'info', 'warning', 'success'];
const TEXT = [100, 400, 500, 600, 700, 800, 900];

const TYPE_SCALE: readonly (readonly [string, string])[] = [
  ['--font-title-studio', 'Studio · 48/58 Gilroy'],
  ['--font-title-h1', 'Heading H1 · 36/43 Gilroy 600'],
  ['--font-title-h4', 'Heading H4 · 24/29 Gilroy 400'],
  ['--font-title-h6', 'Heading H6 · 18 Gilroy 600'],
  ['--font-normal-medium', 'Body medium · 14 Avenir Next 500'],
  ['--font-normal-regular', 'Body regular · 14 Avenir Next 400'],
  ['--font-normal-small', 'Body small · 12 Avenir Next 400'],
  ['--font-code-regular', 'Code · 14 Source Code Pro'],
];

const SPACING: readonly (readonly [string, string])[] = [
  ['--padding-card', 'Card padding'],
  ['--gap-card', 'Card inner gap'],
  ['--padding-form', 'Form padding'],
  ['--gap-form', 'Form gap'],
  ['--gap-button', 'Gap inside a button'],
  ['--gap-element', 'Finest gap'],
];

const RADII: readonly (readonly [string, string])[] = [
  ['--border-radius', 'Fields, buttons, square chips'],
  ['--border-radius-card', 'Cards and modals'],
  ['--radius-pill', 'Tag chips'],
  ['--radius-sub-menu', 'Navigation container'],
];

function swatch(token: string, label: string): TemplateResult {
  return html`<div style="display:flex;align-items:center;gap:12px">
    <span
      style=${`width:40px;height:40px;border-radius:8px;flex:none;background:var(${token});border:1px solid var(--border-subtle)`}
    ></span>
    <span class="stack" style="gap:2px">
      <span>${label}</span>
      <kt-badge variant="code">${token}</kt-badge>
    </span>
  </div>`;
}

export function foundationsPage(): TemplateResult {
  return html`
    <header class="page-header">
      <h1>Foundations</h1>
      <p>
        Every visual decision in Kanto resolves to a CSS custom property. Components hard-code no
        colour, no size and no duration — which is what makes the light theme possible without a
        single line of theme-specific CSS.
      </p>
    </header>

    <section>
      <h6>Surfaces</h6>
      <p style="color:var(--text-muted);margin-bottom:14px">
        Elevation in Kanto is a lighter surface, not a shadow. The only real shadow in the system is
        on toasts.
      </p>
      <div class="grid">
        ${SURFACES.map((step) => swatch(`--color-dark-${step}`, `dark-${step}`))}
      </div>
    </section>

    <section>
      <h6>Semantic colours</h6>
      <p style="color:var(--text-muted);margin-bottom:14px">
        Each colour ships in three variants: <code>-base</code> opaque, <code>-soft</code> at 12%
        and <code>-hover</code> at 16%.
      </p>
      <div class="grid">
        ${SEMANTIC.map((name) => swatch(`--color-${name}-base`, name))}
        ${SEMANTIC.map((name) => swatch(`--color-${name}-soft`, `${name} soft`))}
      </div>
    </section>

    <section>
      <h6>Text</h6>
      <div class="grid">${TEXT.map((step) => swatch(`--color-text-${step}`, `text-${step}`))}</div>
    </section>

    <section>
      <h6>Typography</h6>
      <div class="stack">
        ${TYPE_SCALE.map(
          ([token, label]) =>
            html`<kt-card>
              <div style=${`font: var(${token})`}>${label}</div>
              <kt-badge slot="footer" variant="code">${token}</kt-badge>
            </kt-card>`,
        )}
      </div>
    </section>

    <section>
      <h6>Spacing</h6>
      <div class="stack">
        ${SPACING.map(
          ([token, label]) =>
            html`<div class="row">
              <span
                style=${`height:20px;background:var(--color-primary-soft);border-left:2px solid var(--color-primary-base);border-right:2px solid var(--color-primary-base);width:var(${token})`}
              ></span>
              <kt-badge variant="code">${token}</kt-badge>
              <span style="color:var(--text-muted)">${label}</span>
            </div>`,
        )}
      </div>
    </section>

    <section>
      <h6>Radii</h6>
      <div class="grid">
        ${RADII.map(
          ([token, label]) =>
            html`<div class="row">
              <span
                style=${`width:56px;height:40px;flex:none;background:var(--surface-raised);border-radius:var(${token})`}
              ></span>
              <span class="stack" style="gap:2px">
                <kt-badge variant="code">${token}</kt-badge>
                <span style="color:var(--text-muted);font:var(--font-normal-small)">${label}</span>
              </span>
            </div>`,
        )}
      </div>
    </section>
  `;
}
