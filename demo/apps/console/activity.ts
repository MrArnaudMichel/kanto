import { html, type TemplateResult } from 'lit';
import { rerender } from '../../lib/render.js';
import { consoleShell } from '../shell.js';

/** The audit log — the screen `<kt-timeline>` was written for. */

type Kind = 'billing' | 'access' | 'system' | 'data';

interface Event {
  readonly heading: string;
  readonly body: string;
  readonly time: string;
  readonly day: string;
  readonly icon: string;
  readonly variant: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  readonly kind: Kind;
  readonly actor: string;
}

const EVENTS: readonly Event[] = [
  {
    heading: 'Invoice #4820 settled',
    body: 'Meridian Freight paid $18,240 in full, two days early.',
    time: '18:41',
    day: 'Today',
    icon: 'check',
    variant: 'success',
    kind: 'billing',
    actor: 'Stripe',
  },
  {
    heading: 'Sync agent quiet',
    body: 'No word from the eu-west-1 agent since 07:12. Retrying every five minutes.',
    time: '16:04',
    day: 'Today',
    icon: 'triangle-alert',
    variant: 'warning',
    kind: 'system',
    actor: 'Monitor',
  },
  {
    heading: 'Three seats added',
    body: 'Applied at the next renewal. The workspace now holds 22 of 25 seats.',
    time: '11:26',
    day: 'Today',
    icon: 'user-plus',
    variant: 'info',
    kind: 'access',
    actor: 'Dana Whitfield',
  },
  {
    heading: 'Export finished',
    body: '48,210 rows written to audit-export-2026-09-10.xlsx.',
    time: '09:02',
    day: 'Today',
    icon: 'download',
    variant: 'neutral',
    kind: 'data',
    actor: 'Scheduler',
  },
  {
    heading: 'Failed sign-in blocked',
    body: 'Six attempts from an unrecognised address in 40 seconds. The account is unlocked.',
    time: '22:47',
    day: 'Yesterday',
    icon: 'shield-alert',
    variant: 'danger',
    kind: 'access',
    actor: 'Security',
  },
  {
    heading: 'Retention policy changed',
    body: 'Audit logs are now kept for 400 days, up from 90.',
    time: '15:12',
    day: 'Yesterday',
    icon: 'shield',
    variant: 'neutral',
    kind: 'system',
    actor: 'Dana Whitfield',
  },
  {
    heading: 'Plan upgraded to Scale',
    body: 'Billed annually. The change takes effect immediately.',
    time: '10:35',
    day: 'Yesterday',
    icon: 'trending-up',
    variant: 'primary',
    kind: 'billing',
    actor: 'Dana Whitfield',
  },
];

const FILTERS: readonly { value: Kind | 'all'; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'billing', label: 'Billing' },
  { value: 'access', label: 'Access' },
  { value: 'system', label: 'System' },
  { value: 'data', label: 'Data' },
];

const state = { kind: 'all' as Kind | 'all' };

export function consoleActivity(): TemplateResult {
  const events = EVENTS.filter((e) => state.kind === 'all' || e.kind === state.kind);
  const days = [...new Set(events.map((e) => e.day))];

  const body = html`
    <kt-page-header
      eyebrow="System"
      heading="Activity"
      description="Everything that happened in this workspace, newest first. Kept for 400 days."
    >
      <kt-button slot="actions" variant="dark" icon="download">Export log</kt-button>
    </kt-page-header>

    <kt-card class="toolbar-card">
      <div class="toolbar">
        <kt-toggle-button-group
          label="Filter by kind"
          .value=${state.kind}
          @kt-change=${(e: CustomEvent<{ value: string | null }>) => {
            state.kind = (e.detail.value as Kind | null) ?? 'all';
            rerender();
          }}
        >
          ${FILTERS.map(
            (filter) =>
              html`<kt-toggle-button value=${filter.value}>${filter.label}</kt-toggle-button>`,
          )}
        </kt-toggle-button-group>
        <span style="flex:1"></span>
        <span class="muted" style="font:var(--font-normal-small)"
          >${events.length} ${events.length === 1 ? 'event' : 'events'}</span
        >
      </div>
    </kt-card>

    ${
      events.length === 0
        ? html`<kt-card>
            <kt-empty-state
              icon="activity"
              heading="Nothing of that kind"
              description="Nothing has happened under this heading in the period kept."
            >
              <kt-button
                slot="actions"
                variant="dark"
                @click=${() => {
                  state.kind = 'all';
                  rerender();
                }}
                >Show everything</kt-button
              >
            </kt-empty-state>
          </kt-card>`
        : days.map(
            (day) => html`
              <section>
                <kt-page-header level="section" heading=${day}></kt-page-header>
                <kt-card style="margin-top:12px">
                  <kt-timeline>
                    ${events
                      .filter((event) => event.day === day)
                      .map(
                        (event) => html`
                          <kt-timeline-item
                            heading=${event.heading}
                            time=${event.time}
                            icon=${event.icon}
                            variant=${event.variant}
                          >
                            ${event.body}
                            <span class="event-actor">
                              <kt-icon name="user" size="12"></kt-icon>
                              ${event.actor}
                            </span>
                          </kt-timeline-item>
                        `,
                      )}
                  </kt-timeline>
                </kt-card>
              </section>
            `,
          )
    }
  `;

  return consoleShell('activity', body);
}
