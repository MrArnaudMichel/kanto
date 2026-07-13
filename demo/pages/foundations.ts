import { html, type TemplateResult } from 'lit';

const SURFACES = [8, 12, 14, 15, 16, 18, 19, 20, 22, 23, 24];
const SEMANTIC = ['primary', 'danger', 'info', 'warning', 'success'];
const TEXT = [100, 400, 500, 600, 700, 800, 900];

const TYPE_SCALE: readonly (readonly [string, string])[] = [
  ['--font-title-studio', 'Studio · 48/58 Gilroy'],
  ['--font-title-h1', 'Titre H1 · 36/43 Gilroy 600'],
  ['--font-title-h4', 'Titre H4 · 24/29 Gilroy 400'],
  ['--font-title-h6', 'Titre H6 · 18 Gilroy 600'],
  ['--font-normal-medium', 'Corps medium · 14 Avenir Next 500'],
  ['--font-normal-regular', 'Corps regular · 14 Avenir Next 400'],
  ['--font-normal-small', 'Corps small · 12 Avenir Next 400'],
  ['--font-code-regular', 'Code · 14 Source Code Pro'],
];

const SPACING: readonly (readonly [string, string])[] = [
  ['--padding-card', 'Padding des cartes'],
  ['--gap-card', 'Gap interne des cartes'],
  ['--padding-form', 'Padding des formulaires'],
  ['--gap-form', 'Gap des formulaires'],
  ['--gap-button', 'Gap dans un bouton'],
  ['--gap-element', 'Gap le plus fin'],
];

const RADII: readonly (readonly [string, string])[] = [
  ['--border-radius', 'Champs, boutons, chips carrés'],
  ['--border-radius-card', 'Cartes et modales'],
  ['--radius-pill', 'Chips tag'],
  ['--radius-sub-menu', 'Conteneur de navigation'],
];

function swatch(token: string, label: string): TemplateResult {
  return html`<div style="display:flex;align-items:center;gap:12px">
    <span
      style=${`width:40px;height:40px;border-radius:8px;flex:none;background:var(${token});border:1px solid var(--border-subtle)`}
    ></span>
    <span class="stack" style="gap:2px">
      <span>${label}</span>
      <kt-chip variant="code">${token}</kt-chip>
    </span>
  </div>`;
}

export function foundationsPage(): TemplateResult {
  return html`
    <header class="page-header">
      <h1>Fondations</h1>
      <p>
        Chaque décision visuelle de Kanto se résout en une custom property. Les composants ne codent
        en dur ni couleur, ni taille, ni durée — c'est ce qui rend le thème clair possible sans une
        seule ligne de CSS spécifique.
      </p>
    </header>

    <section>
      <h6>Surfaces</h6>
      <p style="color:var(--text-muted);margin-bottom:14px">
        L'élévation, dans Kanto, est une surface plus claire — pas une ombre. La seule vraie ombre
        du système est sur les toasts.
      </p>
      <div class="grid">
        ${SURFACES.map((step) => swatch(`--color-dark-${step}`, `dark-${step}`))}
      </div>
    </section>

    <section>
      <h6>Couleurs sémantiques</h6>
      <p style="color:var(--text-muted);margin-bottom:14px">
        Chaque couleur existe en trois variantes : <code>-base</code> opaque, <code>-soft</code> à
        12 % et <code>-hover</code> à 16 %.
      </p>
      <div class="grid">
        ${SEMANTIC.map((name) => swatch(`--color-${name}-base`, name))}
        ${SEMANTIC.map((name) => swatch(`--color-${name}-soft`, `${name} soft`))}
      </div>
    </section>

    <section>
      <h6>Texte</h6>
      <div class="grid">${TEXT.map((step) => swatch(`--color-text-${step}`, `text-${step}`))}</div>
    </section>

    <section>
      <h6>Typographie</h6>
      <div class="stack">
        ${TYPE_SCALE.map(
          ([token, label]) =>
            html`<kt-card>
              <div style=${`font: var(${token})`}>${label}</div>
              <kt-chip slot="footer" variant="code">${token}</kt-chip>
            </kt-card>`,
        )}
      </div>
    </section>

    <section>
      <h6>Espacements</h6>
      <div class="stack">
        ${SPACING.map(
          ([token, label]) =>
            html`<div class="row">
              <span
                style=${`height:20px;background:var(--color-primary-soft);border-left:2px solid var(--color-primary-base);border-right:2px solid var(--color-primary-base);width:var(${token})`}
              ></span>
              <kt-chip variant="code">${token}</kt-chip>
              <span style="color:var(--text-muted)">${label}</span>
            </div>`,
        )}
      </div>
    </section>

    <section>
      <h6>Rayons</h6>
      <div class="grid">
        ${RADII.map(
          ([token, label]) =>
            html`<div class="row">
              <span
                style=${`width:56px;height:40px;flex:none;background:var(--surface-raised);border-radius:var(${token})`}
              ></span>
              <span class="stack" style="gap:2px">
                <kt-chip variant="code">${token}</kt-chip>
                <span style="color:var(--text-muted);font:var(--font-normal-small)">${label}</span>
              </span>
            </div>`,
        )}
      </div>
    </section>
  `;
}
