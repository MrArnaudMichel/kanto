import { html, type TemplateResult } from 'lit';
import { toaster } from 'kanto-ds';
import { rerender } from '../../lib/render.js';
import { buildEntities } from '../../lib/data.js';
import { consoleShell } from '../shell.js';

/**
 * Settings, as four screens rather than one long scroll.
 *
 * Each is a different shape on purpose: a form, a table of people, a grid of
 * switches, and a page that is mostly warnings.
 */

export type SettingsSection = 'general' | 'members' | 'notifications' | 'security';

const MEMBERS = buildEntities(6, 8080).map((row, index) => ({
  ...row,
  role: (['Owner', 'Admin', 'Member', 'Member', 'Viewer', 'Viewer'] as const)[index] ?? 'Member',
}));

const state = {
  saving: false,
  dirty: false,
  removing: null as string | null,
  notifications: {
    mentions: true,
    replies: true,
    digest: false,
    marketing: false,
    security: true,
  } as Record<string, boolean>,
};

const TITLES: Record<SettingsSection, string> = {
  general: 'General',
  members: 'Members',
  notifications: 'Notifications',
  security: 'Security',
};

function general(): TemplateResult {
  return html`<form
    @submit=${(e: SubmitEvent) => {
      e.preventDefault();
      state.saving = true;
      rerender();
      setTimeout(() => {
        state.saving = false;
        state.dirty = false;
        rerender();
        toaster.success('Workspace updated');
      }, 800);
    }}
  >
    <div class="settings-grid">
      <kt-form
        heading="Workspace"
        description="How this workspace appears to everyone in it."
        ?disabled=${state.saving}
      >
        <kt-label-input label="Name" required>
          <kt-input
            name="name"
            value="Kanto Studio"
            required
            @kt-input=${() => {
              state.dirty = true;
            }}
          ></kt-input>
        </kt-label-input>
        <kt-label-input label="Workspace URL">
          <kt-input name="slug" value="kanto-studio"></kt-input>
        </kt-label-input>
        <kt-label-input label="Description">
          <kt-textarea name="about" rows="3" maxlength="180"></kt-textarea>
        </kt-label-input>
        <kt-label-input label="Logo">
          <kt-drag-drop accept="image/*" recommended-size="256×256px"></kt-drag-drop>
        </kt-label-input>

        <kt-button slot="footer" variant="dark" type="reset">Reset</kt-button>
        <kt-button slot="footer" type="submit" ?disabled=${state.saving}
          >${state.saving ? 'Saving…' : 'Save changes'}</kt-button
        >
      </kt-form>

      <div class="stack">
        <kt-form heading="Region" description="Where this workspace's data lives.">
          <kt-label-input label="Data residency">
            <kt-select
              name="region"
              .value=${'eu'}
              .options=${[
                { id: 'eu', label: 'Europe (Frankfurt)' },
                { id: 'us', label: 'United States (Virginia)' },
                { id: 'ap', label: 'Asia Pacific (Singapore)' },
              ]}
            ></kt-select>
          </kt-label-input>
          <kt-alert
            variant="warning"
            description="Moving a workspace between regions takes up to 24 hours and cannot be reversed."
          ></kt-alert>
        </kt-form>

        <kt-form heading="Danger zone">
          <kt-alert
            variant="danger"
            heading="Delete this workspace"
            description="Everything in it goes: customers, orders, history."
          >
            <kt-button
              slot="actions"
              variant="delete"
              size="small"
              @click=${() => toaster.error('Deleting a workspace is disabled in the demo.')}
              >Delete workspace</kt-button
            >
          </kt-alert>
        </kt-form>
      </div>
    </div>
  </form>`;
}

function members(): TemplateResult {
  return html`<kt-card>
    <div slot="header" class="row" style="justify-content:space-between">
      <h6>People with access</h6>
      <kt-button
        size="small"
        icon="plus"
        @click=${() => toaster.info('Invitation flow not wired up')}
        >Invite</kt-button
      >
    </div>

    <kt-table
      label="Members"
      .columns=${[
        { key: 'owner', label: 'Person', sortable: true },
        { key: 'role', label: 'Role', sortable: true, width: '140px' },
        { key: 'updated', label: 'Last seen', width: '140px' },
        { key: 'actions', label: '', width: '60px', align: 'right' },
      ]}
      .data=${MEMBERS}
      .renderCell=${(row: Record<string, unknown>, column: { key: string }) => {
        if (column.key === 'owner') {
          return html`<span class="cell-person">
            <kt-avatar name=${String(row['owner'])} size="small" status="online"></kt-avatar>
            <span class="stack" style="gap:0">
              <span>${row['owner']}</span>
              <span class="muted" style="font:var(--font-normal-small)"
                >${String(row['owner'])
                  .toLowerCase()
                  .replace(/[^a-z]/g, '.')}@kanto.studio</span
              >
            </span>
          </span>`;
        }
        if (column.key === 'role') {
          return html`<kt-badge variant=${row['role'] === 'Owner' ? 'primary' : 'neutral'}
            >${row['role']}</kt-badge
          >`;
        }
        if (column.key === 'actions') {
          return html`<kt-button
            variant="secondary-no-bg"
            size="small"
            icon="trash-2"
            label=${`Remove ${String(row['owner'])}`}
            ?disabled=${row['role'] === 'Owner'}
            @click=${(e: Event) => {
              e.stopPropagation();
              state.removing = String(row['owner']);
              rerender();
            }}
          ></kt-button>`;
        }
        return undefined;
      }}
    ></kt-table>

    <kt-confirm-dialog
      ?open=${state.removing !== null}
      heading=${`Remove ${state.removing ?? ''}?`}
      message="They lose access immediately."
      confirm-label="Remove"
      @kt-confirm=${() => {
        toaster.success(`${state.removing} removed`);
        state.removing = null;
        rerender();
      }}
      @kt-cancel=${() => {
        state.removing = null;
        rerender();
      }}
    ></kt-confirm-dialog>
  </kt-card>`;
}

function notifications(): TemplateResult {
  const groups = [
    {
      heading: 'Activity',
      description: 'What happens in the workspace.',
      items: [
        ['mentions', 'Someone mentions me', 'Always worth knowing.'],
        ['replies', 'Replies to my messages', ''],
        ['digest', 'Weekly digest', 'A summary every Monday morning.'],
      ],
    },
    {
      heading: 'Other',
      description: '',
      items: [
        ['security', 'Security alerts', 'Sign-ins from a new device. Cannot be turned off.'],
        ['marketing', 'Product news', 'Occasional, and never more than monthly.'],
      ],
    },
  ] as const;

  return html`<div class="settings-narrow">
    ${groups.map(
      (group) =>
        html`<kt-form heading=${group.heading} description=${group.description}>
          ${group.items.map(
            ([key, label, hint]) =>
              html`<div class="setting-row">
                <div class="stack" style="gap:2px">
                  <span>${label}</span>
                  ${hint ? html`<span class="muted" style="font:var(--font-normal-small)">${hint}</span>` : ''}
                </div>
                <kt-toggle
                  label=${label}
                  ?checked=${state.notifications[key]}
                  ?disabled=${key === 'security'}
                  @kt-change=${(e: CustomEvent<{ checked: boolean }>) => {
                    state.notifications[key] = e.detail.checked;
                    rerender();
                    toaster.info(`${label}: ${e.detail.checked ? 'on' : 'off'}`);
                  }}
                ></kt-toggle>
              </div>`,
          )}
        </kt-form>`,
    )}
  </div>`;
}

function security(): TemplateResult {
  return html`<div class="settings-narrow">
    <kt-form heading="Password">
      <kt-label-input label="Current password" required>
        <kt-input type="password" name="current"></kt-input>
      </kt-label-input>
      <kt-label-input label="New password" required>
        <kt-input type="password" name="next"></kt-input>
      </kt-label-input>
      <kt-progress-bar
        value="72"
        variant="success"
        size="small"
        label="Password strength"
      ></kt-progress-bar>
      <kt-button slot="footer" @click=${() => toaster.success('Password updated')}
        >Update</kt-button
      >
    </kt-form>

    <kt-form heading="Two-factor authentication">
      <kt-alert
        variant="success"
        heading="Enabled"
        description="Using an authenticator app since 14 June 2026."
      >
        <kt-button slot="actions" size="small" variant="dark">View recovery codes</kt-button>
        <kt-button slot="actions" size="small" variant="danger">Disable</kt-button>
      </kt-alert>
    </kt-form>

    <kt-form heading="Sessions" description="Devices currently signed in.">
      <div class="stack">
        ${[
          ['Fedora · Firefox', 'Lyon, France · current session', true],
          ['macOS · Safari', 'Paris, France · 2 days ago', false],
          ['iOS · Kanto app', 'Lyon, France · 5 days ago', false],
        ].map(
          ([device, meta, current]) =>
            html`<div class="setting-row">
              <div class="stack" style="gap:2px">
                <span
                  >${device}
                  ${current ? html`<kt-badge variant="success">This device</kt-badge>` : ''}</span
                >
                <span class="muted" style="font:var(--font-normal-small)">${meta}</span>
              </div>
              ${
                current
                  ? ''
                  : html`<kt-button
                      size="small"
                      variant="danger"
                      @click=${() => toaster.success('Session revoked')}
                      >Revoke</kt-button
                    >`
              }
            </div>`,
        )}
      </div>
    </kt-form>
  </div>`;
}

const SECTIONS: Record<SettingsSection, () => TemplateResult> = {
  general,
  members,
  notifications,
  security,
};

export function consoleSettings(section: SettingsSection): TemplateResult {
  return consoleShell(`settings/${section}`, `Settings — ${TITLES[section]}`, SECTIONS[section]());
}
