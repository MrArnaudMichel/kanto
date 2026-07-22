import { html, type TemplateResult } from 'lit';
import { toaster } from 'kanto-ds';

const BUTTON_VARIANTS = [
  'primary',
  'secondary',
  'secondary-no-bg',
  'dark',
  'danger',
  'delete',
  'warning',
  'info',
  'success',
  'text',
] as const;

const REGIONS = [
  { id: 'ne', label: 'North East' },
  { id: 'sw', label: 'South West' },
  { id: 'nw', label: 'North West', disabled: true },
  { id: 'mid', label: 'Midlands' },
];

function demo(title: string, note: string, content: TemplateResult): TemplateResult {
  return html`<section>
    <h6>${title}</h6>
    <p style="color:var(--text-muted);margin-bottom:14px;max-width:68ch">${note}</p>
    ${content}
  </section>`;
}

export function componentsPage(): TemplateResult {
  return html`
    <header class="page-header">
      <h1>Components</h1>
      <p>
        Twenty-three custom elements. This page is built from them, with no framework: what you see
        here is what you get everywhere else.
      </p>
    </header>

    ${demo(
      'Buttons',
      'Ten variants. Use primary for the action the screen is about, and delete — the only solid red — for the irreversible.',
      html`<div class="row">
          ${BUTTON_VARIANTS.map(
            (variant) => html`<kt-button variant=${variant}>${variant}</kt-button>`,
          )}
        </div>
        <div class="row" style="margin-top:12px">
          <kt-button size="small" icon="plus">Small</kt-button>
          <kt-button icon="refresh-cw">Medium</kt-button>
          <kt-button size="large" icon="chevron-right" icon-position="right">Large</kt-button>
          <kt-button icon="trash-2" variant="danger" label="Delete"></kt-button>
          <kt-button disabled>Disabled</kt-button>
        </div>`,
    )}
    ${demo(
      'Cards',
      'A transparent surface with a 12px radius. A clickable card becomes a real control: focusable and keyboard-activatable.',
      html`<div class="grid">
        <kt-card>
          <h6 slot="header">Revenue</h6>
          <div style="font:var(--font-title-h1)">24 892 €</div>
          <span slot="footer" style="color:var(--color-success-base)">+12.4% this month</span>
        </kt-card>
        <kt-card clickable>
          <h6 slot="header">Entity 4812</h6>
          <span style="color:var(--text-muted)">Clickable — try it with the keyboard.</span>
        </kt-card>
      </div>`,
    )}
    ${demo(
      'Chips',
      'A pill tag, a monospaced code token, or a category badge tinted at 20% through color-mix.',
      html`<div class="row">
        <kt-chip>Active</kt-chip>
        <kt-chip clickable>Filter: region</kt-chip>
        <kt-chip variant="code">--color-primary-base</kt-chip>
        <kt-chip variant="category" color="var(--color-success-base)">Delivered</kt-chip>
        <kt-chip variant="category" color="var(--color-info-base)">Internal</kt-chip>
        <kt-chip error>Failed</kt-chip>
      </div>`,
    )}
    ${demo(
      'Fields',
      'Borderless: a fill that gains a 2px outline — grey on hover, primary on focus, danger on error. An outline sits outside the box, so nothing reflows.',
      html`<div class="stack" style="max-width:420px">
        <kt-input placeholder="Search everything..." icon="search"></kt-input>
        <kt-input type="password" value="hunter2"></kt-input>
        <kt-input type="tel"></kt-input>
        <kt-input error="Invalid email address" value="not-an-address"></kt-input>
        <kt-select placeholder="Select a region" .options=${REGIONS}></kt-select>
        <kt-input-menu placeholder="Search a region" .options=${REGIONS}></kt-input-menu>
        <kt-textarea placeholder="Describe the incident..." maxlength="280"></kt-textarea>
        <kt-toggle checked>Notifications</kt-toggle>
        <kt-drag-drop accept="image/*" recommended-size="800×400px"></kt-drag-drop>
      </div>`,
    )}
    ${demo(
      'Navigation',
      'The segmented control is a radio group: one tab stop, and the arrows move the selection.',
      html`<div class="stack">
        <kt-breadcrumb
          .items=${[
            { label: 'Home', href: '#' },
            { label: 'Components', href: '#components' },
            { label: 'Navigation' },
          ]}
        ></kt-breadcrumb>
        <kt-segmented-control
          label="Period"
          .value=${'week'}
          .options=${[
            { value: 'day', label: 'Day' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
        ></kt-segmented-control>
        <kt-toggle-button-group label="View">
          <kt-toggle-button value="list" icon="list">List</kt-toggle-button>
          <kt-toggle-button value="grid" icon="layout-grid">Grid</kt-toggle-button>
          <kt-toggle-button value="map" icon="map">Map</kt-toggle-button>
        </kt-toggle-button-group>
      </div>`,
    )}
    ${demo(
      'Feedback',
      'Errors interrupt the screen reader; everything else waits its turn. Hovering the toast stack pauses every countdown.',
      html`<div class="stack" style="max-width:520px">
          <kt-progress-bar value="64" show-value label="Import"></kt-progress-bar>
          <kt-progress-bar value="88" variant="warning" striped animated></kt-progress-bar>
          <kt-progress-bar value="100" variant="danger"></kt-progress-bar>
          <kt-skeleton count="3"></kt-skeleton>
        </div>
        <div class="row" style="margin-top:12px">
          <kt-tooltip text="Saves and closes the panel">
            <kt-button variant="secondary">Hover me</kt-button>
          </kt-tooltip>
          <kt-button
            variant="success"
            @click=${() => toaster.success('Entity created', { description: 'It now appears in the list.' })}
            >Success toast</kt-button
          >
          <kt-button
            variant="danger"
            @click=${() => toaster.error('Failed de la sauvegarde', { description: 'Try again in a moment.' })}
            >Error toast</kt-button
          >
        </div>`,
    )}
    ${demo(
      'Overlays',
      'The side panel and the confirmation are built on <dialog>: top layer, trapped focus, inert page, Escape handled by the platform.',
      html`<div class="row">
          <kt-dropdown .options=${REGIONS}>
            <kt-button slot="trigger" variant="dark" icon="chevron-down" icon-position="right"
              >Menu</kt-button
            >
          </kt-dropdown>
          <kt-button
            variant="secondary"
            @click=${() => {
              document.querySelector('kt-side-panel')!.open = true;
            }}
            >Open the panel</kt-button
          >
          <kt-button
            variant="delete"
            @click=${() => {
              document.querySelector('kt-confirm-dialog')!.open = true;
            }}
            >Delete…</kt-button
          >
        </div>

        <kt-side-panel eyebrow="Details" heading="Entity 4812">
          <div class="stack">
            <kt-label-input label="Name"><kt-input value="Entity 4812"></kt-input></kt-label-input>
            <kt-label-input label="Region"
              ><kt-select .options=${REGIONS}></kt-select
            ></kt-label-input>
          </div>
          <kt-button slot="footer" full-width>Save</kt-button>
        </kt-side-panel>

        <kt-confirm-dialog
          heading="Delete this entity?"
          message="This action cannot be undone."
          confirm-label="Delete"
          @kt-confirm=${() => toaster.success('Entity deleted')}
        ></kt-confirm-dialog>`,
    )}
  `;
}
