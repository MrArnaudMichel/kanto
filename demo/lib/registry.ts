import { html, type TemplateResult } from 'lit';
import { MONTHS, monthlyRevenue } from './data.js';

/**
 * The component catalogue behind the documentation site.
 *
 * `doc` is the component's own markdown, imported raw — the page renders the
 * file that sits beside the source, so the two cannot drift.
 *
 * `example` is a live preview, hand-written per component. A screenshot lies
 * eventually; a rendered element cannot.
 */
export interface ComponentEntry {
  readonly slug: string;
  readonly name: string;
  readonly group: string;
  readonly doc: string;
  readonly example: () => TemplateResult;
}

const REGIONS = [
  { id: 'ne', label: 'North East' },
  { id: 'sw', label: 'South West' },
  { id: 'mid', label: 'Midlands', disabled: true },
  { id: 'nw', label: 'North West' },
];

/**
 * Every component's markdown, bundled at build time. Vite types this as
 * Record<string, string> because of the `?raw` query and the `default` import.
 */
const docs: Record<string, string> = import.meta.glob('../../src/components/*/kt-*/kt-*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
});

/** Live previews, keyed by tag name. */
const EXAMPLES: Record<string, () => TemplateResult> = {
  'kt-avatar': () =>
    html`<div class="demo-row">
      <kt-avatar name="Benjamin Canac"></kt-avatar>
      <kt-avatar name="Emma Davis" status="online"></kt-avatar>
      <kt-avatar name="Frank Nguyen" size="large" status="busy"></kt-avatar>
      <kt-avatar name="Kanto Studio" square size="large"></kt-avatar>
    </div>`,

  'kt-badge': () =>
    html`<div class="demo-row">
      <kt-badge pill>4</kt-badge>
      <kt-badge variant="success">+12%</kt-badge>
      <kt-badge variant="danger">-2%</kt-badge>
      <kt-badge variant="info">Beta</kt-badge>
      <kt-badge pill max="99">128</kt-badge>
    </div>`,

  'kt-kbd': () =>
    html`<div class="demo-row">
      <kt-kbd keys="mod k"></kt-kbd>
      <kt-kbd keys="ctrl shift p"></kt-kbd>
      <kt-kbd>/</kt-kbd>
    </div>`,

  'kt-alert': () =>
    html`<div class="demo-stack" style="max-width:100%">
      <kt-alert
        variant="warning"
        heading="Storage almost full"
        description="You are using 88% of your quota."
        dismissible
      ></kt-alert>
      <kt-alert variant="success" description="Your changes have been published."></kt-alert>
      <kt-alert
        variant="danger"
        heading="Payment failed"
        description="We could not charge your card."
      ></kt-alert>
    </div>`,

  'kt-empty-state': () =>
    html`<kt-empty-state
      icon="inbox"
      heading="Nothing in your inbox"
      description="New messages will appear here as they arrive."
    >
      <kt-button slot="actions" icon="plus">Compose</kt-button>
    </kt-empty-state>`,

  'kt-stat': () =>
    html`<div class="demo-grid">
      <kt-card
        ><kt-stat
          label="Revenue"
          value="$292,342"
          delta="-3%"
          trend="down"
          icon="trending-up"
        ></kt-stat
      ></kt-card>
      <kt-card
        ><kt-stat label="Customers" value="712" delta="+12%" trend="up" icon="users"></kt-stat
      ></kt-card>
      <kt-card
        ><kt-stat
          label="Churn"
          value="2.1%"
          delta="-0.4%"
          trend="down"
          inverted
          icon="clock"
        ></kt-stat
      ></kt-card>
    </div>`,

  'kt-timeline': () =>
    html`<kt-timeline style="max-width:520px">
      <kt-timeline-item
        heading="Deployed to production"
        time="09:24"
        variant="success"
        icon="rocket"
      >
        Build 4210. Twelve commits since the last release.
      </kt-timeline-item>
      <kt-timeline-item heading="Checks passed" time="09:18" variant="info" icon="check">
        Unit, types and the visual suite.
      </kt-timeline-item>
      <kt-timeline-item heading="Review requested" time="09:02">
        Two files, forty lines.
      </kt-timeline-item>
      <kt-timeline-item heading="Branch opened" time="08:41"></kt-timeline-item>
    </kt-timeline>`,

  'kt-chart': () =>
    html`<div class="demo-stack" style="max-width:100%">
      <kt-chart
        label="Revenue by month"
        height="200"
        smooth
        .labels=${MONTHS}
        .series=${[{ name: 'Revenue', values: monthlyRevenue(7) }]}
        .format=${(n: number) => `$${(n * 220).toLocaleString('en-US')}`}
      ></kt-chart>
      <kt-chart
        type="bar"
        label="Orders by region"
        height="160"
        .labels=${['North East', 'South West', 'Midlands', 'North West']}
        .series=${[
          { name: 'This quarter', values: [42, 58, 36, 71] },
          { name: 'Last quarter', values: [38, 44, 41, 55] },
        ]}
      ></kt-chart>
    </div>`,

  'kt-modal': () =>
    html`<div class="demo-row">
      <kt-button
        variant="secondary"
        @click=${(e: Event) => {
          (e.target as HTMLElement).closest('.demo-row')!.querySelector('kt-modal')!.open = true;
        }}
        >Open the modal</kt-button
      >
      <kt-modal heading="Compose" description="This goes to the whole team.">
        <kt-textarea rows="5" placeholder="Write something..."></kt-textarea>
        <kt-button slot="footer" variant="dark">Save draft</kt-button>
        <kt-button slot="footer">Send</kt-button>
      </kt-modal>
    </div>`,

  'kt-collapsible': () =>
    html`<div class="demo-stack" style="max-width:100%">
      <kt-collapsible heading="Notifications" open>
        <div class="demo-stack">
          <kt-toggle checked>Email me about mentions</kt-toggle>
          <kt-toggle>Email me a weekly digest</kt-toggle>
        </div>
      </kt-collapsible>
      <kt-collapsible heading="Security">
        <span class="muted">Two-factor authentication is enabled.</span>
      </kt-collapsible>
    </div>`,

  'kt-button': () =>
    html`<div class="demo-row">
      <kt-button icon="plus">New entity</kt-button>
      <kt-button variant="secondary" icon="refresh-cw">Refresh</kt-button>
      <kt-button variant="dark">Cancel</kt-button>
      <kt-button variant="danger">Delete</kt-button>
      <kt-button variant="text">View full history</kt-button>
      <kt-button icon="trash-2" variant="delete" label="Delete"></kt-button>
      <kt-button disabled>Disabled</kt-button>
    </div>`,

  'kt-card': () =>
    html`<div class="demo-grid">
      <kt-card>
        <h6 slot="header">Revenue</h6>
        <div style="font:var(--font-title-h1)">$24,892</div>
        <span slot="footer" style="color:var(--color-success-base)">+12.4% this month</span>
      </kt-card>
      <kt-card clickable>
        <h6 slot="header">Entity 4812</h6>
        <span style="color:var(--text-muted)">Clickable — try it with the keyboard.</span>
      </kt-card>
    </div>`,

  'kt-chip': () =>
    html`<div class="demo-row">
      <kt-chip>Active</kt-chip>
      <kt-chip clickable>Filter: region</kt-chip>
      <kt-chip variant="code">--color-primary-base</kt-chip>
      <kt-chip variant="category" color="var(--color-success-base)">Delivered</kt-chip>
      <kt-chip error>Failed</kt-chip>
    </div>`,

  'kt-code': () =>
    html`<div class="demo-stack" style="max-width:100%">
      <kt-code language="js" copy
        >const total = items.reduce((sum, i) => sum + i.amount, 0);</kt-code
      >
      <kt-code>npm install kanto-ds</kt-code>
    </div>`,

  'kt-icon': () =>
    html`<div class="demo-row" style="gap:20px">
      ${['search', 'trash-2', 'circle-alert', 'trending-up', 'users', 'settings'].map(
        (name) => html`<kt-icon name=${name} size="24"></kt-icon>`,
      )}
    </div>`,

  'kt-form': () =>
    html`<form @submit=${(e: Event) => e.preventDefault()}>
      <kt-form heading="Identity" description="Fields sit one step below the panel.">
        <kt-label-input label="Company name" required>
          <kt-input name="company" value="Kanto Studio"></kt-input>
        </kt-label-input>
        <kt-label-input label="Region">
          <kt-select placeholder="Select a region" .options=${REGIONS}></kt-select>
        </kt-label-input>
        <kt-button slot="footer" variant="dark" type="reset">Reset</kt-button>
        <kt-button slot="footer" type="submit">Save</kt-button>
      </kt-form>
    </form>`,

  'kt-input': () =>
    html`<div class="demo-stack">
      <kt-input placeholder="Search everything..." icon="search"></kt-input>
      <kt-input type="password" value="hunter2"></kt-input>
      <kt-input type="tel"></kt-input>
      <kt-input error="Invalid email address" value="not-an-address"></kt-input>
    </div>`,

  'kt-textarea': () =>
    html`<kt-textarea
      placeholder="Describe the incident..."
      maxlength="280"
      rows="4"
    ></kt-textarea>`,

  'kt-label-input': () =>
    html`<kt-label-input label="Email address" required>
      <kt-input name="email" type="email" placeholder="hello@example.com"></kt-input>
    </kt-label-input>`,

  'kt-select': () =>
    html`<kt-select placeholder="Select a region" .options=${REGIONS}></kt-select>`,

  'kt-input-menu': () =>
    html`<kt-input-menu placeholder="Search a region" .options=${REGIONS}></kt-input-menu>`,

  'kt-toggle': () =>
    html`<div class="demo-stack">
      <kt-toggle checked>Notifications</kt-toggle>
      <kt-toggle size="small">Compact rows</kt-toggle>
      <kt-toggle disabled>Unavailable</kt-toggle>
    </div>`,

  'kt-drag-drop': () =>
    html`<kt-drag-drop accept="image/*" recommended-size="800×400px"></kt-drag-drop>`,

  'kt-header': () =>
    html`<kt-header bordered style="--kt-header-height:56px">
      <strong slot="brand">KANTO</strong>
      <nav class="demo-row" style="gap:16px">
        <a href="#components/kt-header">Docs</a>
        <a href="#components/kt-header">Components</a>
      </nav>
      <kt-button slot="actions" size="small" variant="dark" icon="search">Search</kt-button>
    </kt-header>`,

  'kt-breadcrumb': () => {
    const trail = html`<kt-breadcrumb
      .items=${[
        { label: 'Home', href: '#' },
        { label: 'Entities', href: '#' },
        { label: 'Entity 4812' },
      ]}
    ></kt-breadcrumb>`;
    return trail;
  },

  'kt-sub-menu-navigation': () =>
    html`<kt-sub-menu-navigation
      style="max-width:280px"
      active-href="#nav-roles"
      .sections=${[
        {
          title: 'Workspace',
          items: [
            { label: 'Home', href: '#nav-home', icon: 'house' },
            { label: 'Inbox', href: '#nav-inbox', icon: 'inbox', badge: '4' },
            { label: 'Customers', href: '#nav-customers', icon: 'users' },
          ],
        },
        {
          title: 'Administration',
          items: [
            {
              label: 'Settings',
              icon: 'settings',
              children: [
                { label: 'General', href: '#nav-general' },
                {
                  label: 'Members',
                  children: [
                    { label: 'People', href: '#nav-people' },
                    { label: 'Roles', href: '#nav-roles' },
                  ],
                },
              ],
            },
            { label: 'Logs', href: '#nav-logs', icon: 'scroll-text' },
          ],
        },
      ]}
    ></kt-sub-menu-navigation>`,

  'kt-tabs': () =>
    html`<kt-tabs
      label="Sections"
      .value=${'usage'}
      .tabs=${[
        { value: 'usage', label: 'Usage' },
        { value: 'api', label: 'API', icon: 'code' },
        { value: 'theme', label: 'Theme', disabled: true },
      ]}
    ></kt-tabs>`,

  'kt-segmented-control': () =>
    html`<kt-segmented-control
      label="Period"
      .value=${'week'}
      .options=${[
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
        { value: 'month', label: 'Month' },
      ]}
    ></kt-segmented-control>`,

  'kt-toggle-button': () =>
    html`<div class="demo-row">
      <kt-toggle-button icon="bold" label="Bold"></kt-toggle-button>
      <kt-toggle-button variant="secondary" selected>Secondary</kt-toggle-button>
      <kt-toggle-button variant="outline">Outline</kt-toggle-button>
    </div>`,

  'kt-toggle-button-group': () =>
    html`<kt-toggle-button-group label="View">
      <kt-toggle-button value="list" icon="list">List</kt-toggle-button>
      <kt-toggle-button value="grid" icon="layout-grid">Grid</kt-toggle-button>
      <kt-toggle-button value="map" icon="map">Map</kt-toggle-button>
    </kt-toggle-button-group>`,

  'kt-progress-bar': () =>
    html`<div class="demo-stack">
      <kt-progress-bar value="64" show-value label="Importing"></kt-progress-bar>
      <kt-progress-bar value="88" variant="warning" striped animated></kt-progress-bar>
      <kt-progress-bar value="100"></kt-progress-bar>
    </div>`,

  'kt-skeleton': () =>
    html`<div class="demo-stack">
      <kt-skeleton count="3"></kt-skeleton>
      <kt-skeleton variant="circle" width="48px" height="48px"></kt-skeleton>
    </div>`,

  'kt-tooltip': () =>
    html`<kt-tooltip text="Saves and closes the panel">
      <kt-button variant="secondary">Hover me</kt-button>
    </kt-tooltip>`,

  'kt-toast': () =>
    html`<div class="demo-stack">
      <kt-toast variant="success" heading="Entity created" dismissible></kt-toast>
      <kt-toast
        variant="error"
        heading="Could not save"
        description="Try again in a moment."
        dismissible
      ></kt-toast>
    </div>`,

  'kt-toast-container': () =>
    html`<div class="demo-row">
      <kt-button
        variant="success"
        @click=${() => void import('kanto-ds').then((m) => m.toaster.success('Entity created'))}
        >Success toast</kt-button
      >
      <kt-button
        variant="danger"
        @click=${() =>
          void import('kanto-ds').then((m) =>
            m.toaster.error('Could not save', { description: 'Try again in a moment.' }),
          )}
        >Error toast</kt-button
      >
    </div>`,

  'kt-dropdown': () =>
    html`<kt-dropdown
      .options=${[
        { id: 'edit', label: 'Edit' },
        { id: 'duplicate', label: 'Duplicate' },
        { id: 'delete', label: 'Delete' },
      ]}
    >
      <kt-button slot="trigger" variant="dark" icon="chevron-down" icon-position="right"
        >Actions</kt-button
      >
    </kt-dropdown>`,

  'kt-side-panel': () =>
    html`<div class="demo-row">
      <kt-button
        variant="secondary"
        @click=${(e: Event) => {
          const root = (e.target as HTMLElement).closest('.demo-row')!;
          root.querySelector('kt-side-panel')!.open = true;
        }}
        >Open the panel</kt-button
      >
      <kt-side-panel eyebrow="Details" heading="Entity 4812">
        <p style="color:var(--text-muted)">
          Focus is trapped, Escape closes, the page behind is inert.
        </p>
      </kt-side-panel>
    </div>`,

  'kt-confirm-dialog': () =>
    html`<div class="demo-row">
      <kt-button
        variant="delete"
        @click=${(e: Event) => {
          const root = (e.target as HTMLElement).closest('.demo-row')!;
          root.querySelector('kt-confirm-dialog')!.open = true;
        }}
        >Delete…</kt-button
      >
      <kt-confirm-dialog
        heading="Delete this entity?"
        message="This action cannot be undone."
        confirm-label="Delete"
      ></kt-confirm-dialog>
    </div>`,

  'kt-table': () =>
    html`<kt-table
      label="Entities"
      compact
      .columns=${[
        { key: 'name', label: 'Name', sortable: true },
        { key: 'region', label: 'Region', sortable: true },
        { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
      ]}
      .data=${[
        { id: 1, name: 'Entity 4812', region: 'North East', amount: 1240 },
        { id: 2, name: 'Entity 4811', region: 'South West', amount: 320 },
        { id: 3, name: 'Entity 4810', region: 'Midlands', amount: 2980 },
      ]}
    ></kt-table>`,

  'kt-pagination': () => html`<kt-pagination page="2" total-pages="7"></kt-pagination>`,
};

const GROUP_LABEL: Record<string, string> = {
  core: 'Core',
  forms: 'Forms',
  navigation: 'Navigation',
  feedback: 'Feedback',
  overlays: 'Overlays',
  data: 'Data',
};

/** Order the sidebar follows — roughly "what you reach for first". */
const GROUP_ORDER = ['core', 'forms', 'navigation', 'feedback', 'overlays', 'data'];

export const COMPONENTS: readonly ComponentEntry[] = Object.entries(docs)
  .map(([path, doc]) => {
    const match = /components\/([a-z]+)\/(kt-[a-z-]+)\//.exec(path);
    const group = match?.[1] ?? 'core';
    const slug = match?.[2] ?? '';

    return {
      slug,
      name: slug,
      group: GROUP_LABEL[group] ?? group,
      doc,
      example:
        EXAMPLES[slug] ?? (() => html`<p class="muted">No live preview for this one yet.</p>`),
      groupKey: group,
    };
  })
  .sort((a, b) => {
    const byGroup = GROUP_ORDER.indexOf(a.groupKey) - GROUP_ORDER.indexOf(b.groupKey);
    return byGroup !== 0 ? byGroup : a.slug.localeCompare(b.slug);
  });
