import { html, type TemplateResult } from 'lit';
import { toaster } from 'kanto-ds';
import { rerender } from '../../lib/render.js';
import { consoleShell } from '../shell.js';

/** Integrations: a grid of things that are either on or off, and say why. */

interface Integration {
  readonly id: string;
  readonly name: string;
  readonly note: string;
  readonly icon: string;
  readonly tone: string;
  readonly category: 'Billing' | 'Data' | 'Messaging' | 'Identity';
  readonly detail: string;
}

const CATALOGUE: readonly Integration[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    note: 'Billing and invoices',
    icon: 'credit-card',
    tone: 'violet',
    category: 'Billing',
    detail: 'Invoices, refunds and dunning are mirrored into the customer record.',
  },
  {
    id: 'postgres',
    name: 'Postgres',
    note: 'Primary datastore',
    icon: 'database',
    tone: 'blue',
    category: 'Data',
    detail: 'Read replica in eu-west-1, refreshed every 30 seconds.',
  },
  {
    id: 's3',
    name: 'Object storage',
    note: 'Exports and backups',
    icon: 'hard-drive',
    tone: 'green',
    category: 'Data',
    detail: 'Nightly exports, kept 90 days, encrypted with a workspace key.',
  },
  {
    id: 'slack',
    name: 'Slack',
    note: 'Alerts to #ops',
    icon: 'message-circle',
    tone: 'amber',
    category: 'Messaging',
    detail: 'Warnings and failures only — successes would be noise.',
  },
  {
    id: 'okta',
    name: 'Okta',
    note: 'Single sign-on',
    icon: 'key-round',
    tone: 'blue',
    category: 'Identity',
    detail: 'SAML with SCIM provisioning. Requires the Scale plan.',
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    note: 'Anything else',
    icon: 'webhook',
    tone: 'violet',
    category: 'Data',
    detail: 'Signed POSTs on every state change, with a replay window of 24 hours.',
  },
];

const state = {
  connected: new Set(['stripe', 'postgres', 's3']),
  open: null as string | null,
};

export function consoleIntegrations(): TemplateResult {
  const open = CATALOGUE.find((entry) => entry.id === state.open) ?? null;

  const toggle = (entry: Integration) => {
    if (state.connected.has(entry.id)) {
      state.connected.delete(entry.id);
      toaster.info(`${entry.name} disconnected.`);
    } else {
      state.connected.add(entry.id);
      toaster.success(`${entry.name} connected.`);
    }
    rerender();
  };

  const body = html`
    <kt-page-header
      eyebrow="System"
      heading="Integrations"
      description="What this workspace is wired to. Turning one off stops the traffic; it keeps the history."
    >
      <kt-button slot="actions" variant="dark" icon="book-open">Read the API docs</kt-button>
    </kt-page-header>

    <kt-alert
      variant="info"
      heading="Three of six connected"
      description="Nothing here sends real traffic — this console is a demonstration."
    ></kt-alert>

    <div class="integration-grid">
      ${CATALOGUE.map((entry) => {
        const connected = state.connected.has(entry.id);
        return html`
          <kt-card>
            <div slot="header" class="row" style="justify-content:space-between;width:100%">
              <span class=${`tile-icon ${entry.tone}`}>
                <kt-icon name=${entry.icon} size="18"></kt-icon>
              </span>
              <kt-badge variant=${connected ? 'success' : 'neutral'}
                >${connected ? 'Connected' : 'Off'}</kt-badge
              >
            </div>

            <h6 style="margin:0 0 2px">${entry.name}</h6>
            <span class="muted" style="font:var(--font-normal-small)">${entry.note}</span>
            <p class="muted" style="margin:10px 0 0">${entry.detail}</p>

            <div slot="footer" class="row" style="justify-content:space-between;width:100%">
              <kt-button
                variant="text"
                size="small"
                @click=${() => {
                  state.open = entry.id;
                  rerender();
                }}
                >Configure</kt-button
              >
              <kt-toggle
                size="small"
                label=${`Connect ${entry.name}`}
                ?checked=${connected}
                @kt-change=${() => toggle(entry)}
              ></kt-toggle>
            </div>
          </kt-card>
        `;
      })}
    </div>

    <kt-side-panel
      ?open=${open !== null}
      eyebrow=${open?.category ?? 'Integration'}
      heading=${open?.name ?? ''}
      @kt-close=${() => {
        state.open = null;
        rerender();
      }}
    >
      ${
        open
          ? html`
              <p class="muted">${open.detail}</p>
              <kt-form heading="Connection" description="Nothing here is sent anywhere.">
                <kt-label-input label="Endpoint">
                  <kt-input value=${`https://api.${open.id}.example/v2`} readonly></kt-input>
                </kt-label-input>
                <kt-label-input label="Signing secret">
                  <kt-input type="password" value="whsec_demo_0000" readonly></kt-input>
                </kt-label-input>
              </kt-form>
            `
          : ''
      }
      <div slot="footer" class="row" style="justify-content:flex-end">
        <kt-button
          variant="dark"
          @click=${() => {
            state.open = null;
            rerender();
          }}
          >Close</kt-button
        >
        <kt-button @click=${() => toaster.info('Demonstration only — nothing was saved.')}
          >Save</kt-button
        >
      </div>
    </kt-side-panel>
  `;

  return consoleShell('integrations', body);
}
