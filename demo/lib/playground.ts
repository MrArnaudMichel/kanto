/**
 * The home page's playground: Kanto's settings beside a small real screen
 * they re-theme, and the code to take away. The settings go on the frame,
 * not the page — the frame is a container like any other, which is the
 * point being shown — until "Use on this site" hands them over.
 */
import { html, type TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { KT_DENSITIES, KT_RADII, KT_TEXT_SIZES, setAppearance, toaster } from 'kanto-ds';
import { accentChooser, fontChooser, segmented, type DocsAppearance } from './appearance.js';
import { htmlSnippet, jsSnippet } from './snippet.js';
import { openInStackBlitz, stackblitzProject } from './stackblitz.js';
import { VERSION } from './project.js';

const THEMES = [
  { id: 'dark', label: 'Dark' },
  { id: 'light', label: 'Light' },
] as const;

let state: { appearance: DocsAppearance; tab: 'html' | 'js' } | null = null;

export function resetPlayground(): void {
  state = null;
}

export function playground({
  start,
  onUse,
  rerender,
}: {
  start: DocsAppearance;
  onUse: (appearance: DocsAppearance) => void;
  rerender: () => void;
}): TemplateResult {
  state ??= { appearance: { ...start, theme: 'dark' }, tab: 'html' };
  const current = state;
  const set = (patch: Partial<DocsAppearance>) => {
    current.appearance = { ...current.appearance, ...patch };
    rerender();
  };
  // Kanto nests light inside dark, not the reverse.
  const siteIsLight = document.documentElement.dataset['theme'] === 'light';
  // What the frame shows is what is copied and handed over: on a light site
  // that is light, whatever the disabled control last held.
  const shown: DocsAppearance = siteIsLight
    ? { ...current.appearance, theme: 'light' }
    : current.appearance;
  const code = current.tab === 'html' ? htmlSnippet(shown) : jsSnippet(shown);

  return html`<div class="playground">
    <div class="playground-controls">
      <div class="customise-section">
        <p class="customise-heading">Colour</p>
        ${accentChooser(current.appearance.accent, (accent) => set({ accent }))}
      </div>
      <div class="customise-section">
        <p class="customise-heading">Font</p>
        ${fontChooser(current.appearance.font, (font) => set({ font }))}
      </div>
      <div class="customise-section">
        <p class="customise-heading">Corners</p>
        ${segmented('Corners', KT_RADII, current.appearance.radius, (radius) => set({ radius }))}
      </div>
      <div class="customise-section">
        <p class="customise-heading">Density</p>
        ${segmented('Density', KT_DENSITIES, current.appearance.density, (density) => set({ density }))}
      </div>
      <div class="customise-section">
        <p class="customise-heading">Text size</p>
        ${segmented('Text size', KT_TEXT_SIZES, current.appearance.textSize, (textSize) => set({ textSize }))}
      </div>
      <div class="customise-section">
        <p class="customise-heading">Theme</p>
        ${segmented(
          'Theme',
          THEMES,
          siteIsLight ? 'light' : (current.appearance.theme as 'dark' | 'light'),
          (theme) => set({ theme }),
          siteIsLight,
        )}
        ${
          siteIsLight
            ? html`<p class="playground-theme-note">
                Switch the site to dark to preview both themes here.
              </p>`
            : ''
        }
      </div>
    </div>

    <div class="playground-stage">
      <div
        class="playground-frame"
        ${ref((frame) => {
          if (frame instanceof HTMLElement) setAppearance(shown, frame);
        })}
      >
        ${previewScreen()}
      </div>
      <div class="playground-take">
        <kt-tabs
          .tabs=${[
            { value: 'html', label: 'HTML attributes' },
            { value: 'js', label: 'JavaScript' },
          ]}
          .value=${current.tab}
          @kt-change=${(event: CustomEvent<{ value: 'html' | 'js' }>) => {
            current.tab = event.detail.value;
            rerender();
          }}
        ></kt-tabs>
        <pre class="playground-code"><code>${code}</code></pre>
        <div class="playground-actions">
          <kt-button
            class="playground-copy"
            icon="copy"
            @click=${() => {
              void navigator.clipboard?.writeText(code);
              toaster.success('Theme copied');
            }}
            >Copy my theme</kt-button
          >
          <kt-button class="playground-use" variant="secondary" @click=${() => onUse(shown)}
            >Use on this site</kt-button
          >
          <kt-button
            class="playground-stackblitz"
            variant="secondary-no-bg"
            icon="external-link"
            @click=${() => openInStackBlitz(stackblitzProject(shown, VERSION))}
            >Open in StackBlitz</kt-button
          >
        </div>
      </div>
    </div>
  </div>`;
}

const TONES: Record<string, string> = { Paid: 'success', Pending: 'warning', Overdue: 'danger' };

/** Statuses as badges, the way an app would show them. */
const statusCell = (row: Record<string, unknown>, column: { key: string }) =>
  column.key === 'status'
    ? html`<kt-badge tone=${TONES[String(row['status'])] ?? 'neutral'}>${row['status']}</kt-badge>`
    : undefined;

function previewScreen(): TemplateResult {
  return html`<div class="preview-screen">
    <div class="preview-stats">
      <kt-stat
        label="Revenue"
        value="$48,210"
        delta="+8.2%"
        trend="up"
        icon="dollar-sign"
      ></kt-stat>
      <kt-stat label="Active users" value="2,914" delta="+3.1%" trend="up" icon="users"></kt-stat>
    </div>
    <kt-chart
      type="bar"
      label="Signups by month"
      height="140"
      .labels=${['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']}
      .series=${[{ name: 'Signups', values: [42, 58, 51, 73, 88, 96] }]}
    ></kt-chart>
    <form class="preview-form" @submit=${(e: Event) => e.preventDefault()}>
      <kt-input label="Workspace name" value="Northwind"></kt-input>
      <kt-select
        label="Region"
        .options=${[
          { id: 'eu', label: 'Europe' },
          { id: 'us', label: 'United States' },
        ]}
        value="eu"
      ></kt-select>
      <kt-date-picker label="Renewal" value="2026-11-30"></kt-date-picker>
      <kt-toggle checked>Weekly digest</kt-toggle>
      <div class="preview-buttons">
        <kt-button>Save changes</kt-button>
        <kt-button variant="secondary">Cancel</kt-button>
      </div>
    </form>
    <kt-table
      label="Invoices"
      .renderCell=${statusCell}
      .columns=${[
        { key: 'customer', label: 'Customer' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
      ]}
      .data=${[
        { id: 1, customer: 'Acme Corp', amount: '$1,200', status: 'Paid' },
        { id: 2, customer: 'Globex', amount: '$860', status: 'Pending' },
        { id: 3, customer: 'Initech', amount: '$2,430', status: 'Paid' },
        { id: 4, customer: 'Umbrella', amount: '$310', status: 'Overdue' },
      ]}
    ></kt-table>
  </div>`;
}
