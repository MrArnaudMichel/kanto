/**
 * The showcase wall: a page of ordinary product screens — a transfer form, a
 * bug report, a calendar, a login — all Kanto, all live, set side by side so
 * a visitor sees at once what the system is for. Presets above it re-theme the
 * wall alone: same components, every look.
 */
import { html, type TemplateResult } from 'lit';
import { ref } from 'lit/directives/ref.js';
import { setAppearance, toaster, type KtAppearance } from 'kanto-ds';

const PRESETS: { id: string; label: string; appearance: KtAppearance }[] = [
  { id: 'kanto', label: 'Kanto', appearance: {} },
  { id: 'teal-round', label: 'Teal, round', appearance: { accent: 'teal', radius: 'round' } },
  {
    id: 'orange-sharp',
    label: 'Orange, sharp',
    appearance: { accent: 'orange', radius: 'sharp', density: 'compact' },
  },
  { id: 'pink-light', label: 'Pink, light', appearance: { accent: 'pink', theme: 'light' } },
  {
    id: 'slate-plex',
    label: 'Slate, Plex',
    appearance: { accent: 'slate', font: 'plex', density: 'comfortable' },
  },
];

let preset = 'kanto';

export function resetShowcase(): void {
  preset = 'kanto';
}

/** Applies a preset to the wall, resetting what the previous one set. */
function applyPreset(wall: HTMLElement): void {
  const chosen = PRESETS.find((candidate) => candidate.id === preset)!.appearance;
  setAppearance(
    {
      theme: 'dark',
      accent: 'violet',
      font: 'kanto',
      radius: 'default',
      density: 'default',
      textSize: 'default',
      ...chosen,
    },
    wall,
  );
  // On a light site the wall stays light: Kanto nests light in dark only.
  if (!chosen.theme) delete wall.dataset['theme'];
}

const card = (heading: string, note: string, body: TemplateResult, footer?: TemplateResult) =>
  html`<article class="showcase-card">
    <header>
      <h3>${heading}</h3>
      ${note ? html`<p>${note}</p>` : ''}
    </header>
    <div class="showcase-body">${body}</div>
    ${footer ? html`<footer>${footer}</footer>` : ''}
  </article>`;

const bare = (body: TemplateResult) => html`<article class="showcase-card">${body}</article>`;

const ACCOUNTS = [
  { id: 'checking', label: 'Main checking ·8402' },
  { id: 'savings', label: 'High-yield savings ·1192' },
  { id: 'joint', label: 'Joint account ·3307' },
];

const SCREENS: (() => TemplateResult)[] = [
  () =>
    bare(
      html`<kt-label-input label="Your email" required>
          <kt-input
            .clearable=${false}
            type="email"
            icon="mail"
            placeholder="dana@example.com"
          ></kt-input>
        </kt-label-input>
        <p class="showcase-hint">We never share your email.</p>
        <kt-label-input label="Search">
          <kt-input
            .clearable=${false}
            icon="search"
            placeholder="Search documentation…"
          ></kt-input>
        </kt-label-input>
        <div class="showcase-row muted">
          Open from anywhere with <kt-kbd keys="mod k"></kt-kbd>
        </div>`,
    ),
  () =>
    card(
      'Transfer funds',
      'Move money between your accounts.',
      html`<kt-label-input label="Amount"
          ><kt-input .clearable=${false} value="$1,200.00"></kt-input
        ></kt-label-input>
        <kt-label-input label="From"
          ><kt-select .clearable=${false} .options=${ACCOUNTS} value="checking"></kt-select
        ></kt-label-input>
        <kt-label-input label="To"
          ><kt-select .clearable=${false} .options=${ACCOUNTS} value="savings"></kt-select
        ></kt-label-input>
        <dl class="showcase-pairs">
          <div>
            <dt>Estimated arrival</dt>
            <dd>Today</dd>
          </div>
          <div>
            <dt>Transfer fee</dt>
            <dd>$0.00</dd>
          </div>
        </dl>`,
      html`<kt-button variant="primary" @click=${() => toaster.success('Transfer confirmed')}
        >Confirm transfer</kt-button
      >`,
    ),
  () =>
    card(
      'Report a bug',
      'Help us fix it faster.',
      html`<kt-label-input label="Title"
          ><kt-input .clearable=${false} placeholder="What went wrong, in a line"></kt-input
        ></kt-label-input>
        <div class="showcase-split">
          <kt-label-input label="Severity"
            ><kt-select
              .clearable=${false}
              .options=${[
                { id: 'low', label: 'Low' },
                { id: 'medium', label: 'Medium' },
                { id: 'high', label: 'High' },
              ]}
              value="medium"
            ></kt-select
          ></kt-label-input>
          <kt-label-input label="Area"
            ><kt-select
              .clearable=${false}
              .options=${[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'billing', label: 'Billing' },
              ]}
              value="dashboard"
            ></kt-select
          ></kt-label-input>
        </div>
        <kt-label-input label="Steps to reproduce"
          ><kt-textarea rows="3" placeholder="1. Go to…  2. Click on…"></kt-textarea
        ></kt-label-input>`,
      html`<kt-button variant="secondary-no-bg" icon="paperclip">Attach file</kt-button>
        <kt-button variant="primary" @click=${() => toaster.success('Bug reported')}
          >Submit</kt-button
        >`,
    ),
  () =>
    bare(
      html`<kt-empty-state
        icon="landmark"
        heading="Connect your bank"
        description="Link an account to receive payouts every month."
      >
        <kt-button slot="actions" variant="secondary" icon="plug">Set up payouts</kt-button>
      </kt-empty-state>`,
    ),
  () =>
    bare(
      html`<kt-calendar
        value="2026-10-06"
        label="Schedule"
        @kt-change=${(event: CustomEvent<{ value: string }>) =>
          toaster.success(`Booked for ${event.detail.value}`)}
      ></kt-calendar>`,
    ),
  () =>
    card(
      'Invite your team',
      'Add people to this workspace.',
      html`${['alex@northwind.io', 'sam@northwind.io'].map(
          (email, index) =>
            html`<div class="showcase-split">
              <kt-input .clearable=${false} value=${email} label="Email"></kt-input>
              <kt-select
                .clearable=${false}
                label="Role"
                .options=${[
                  { id: 'editor', label: 'Editor' },
                  { id: 'viewer', label: 'Viewer' },
                ]}
                value=${index ? 'viewer' : 'editor'}
              ></kt-select>
            </div>`,
        )}
        <p class="showcase-or">or share a link</p>
        <kt-input
          .clearable=${false}
          value="https://app.northwind.io/invite/x8f2k"
          label="Invite link"
        ></kt-input>`,
      html`<kt-button variant="primary" icon="send" @click=${() => toaster.success('Invites sent')}
        >Send invites</kt-button
      >`,
    ),
  () =>
    card(
      'Visitors',
      '',
      html`<kt-stat label="This week" value="418.2K" delta="+10%" trend="up"></kt-stat>
        <kt-chart
          type="bar"
          label="Visitors by day"
          height="120"
          .labels=${['M', 'T', 'W', 'T', 'F', 'S', 'S']}
          .series=${[{ name: 'Visitors', values: [42, 61, 55, 70, 58, 81, 66] }]}
        ></kt-chart>`,
    ),
  () =>
    bare(
      html`<kt-alert
        variant="info"
        heading="Observability Plus"
        description="Ask your data questions in plain language. Moving to the Pro plan in 2027."
        dismissible
      >
        <kt-button slot="actions" size="small" variant="info">Learn more</kt-button>
      </kt-alert>`,
    ),
  () =>
    card(
      'Notifications',
      'Choose what we tell you about.',
      html`<kt-toggle checked>Transaction alerts</kt-toggle>
        <kt-toggle checked>Security alerts</kt-toggle>
        <kt-toggle>Weekly digest</kt-toggle>
        <kt-toggle>Product news</kt-toggle>`,
    ),
  () =>
    card(
      'Savings targets',
      'Milestones for 2026.',
      html`<kt-progress-bar
          label="Retirement · $420,000"
          value="65"
          show-label
          show-value
        ></kt-progress-bar>
        <kt-progress-bar
          label="Real estate · $85,000"
          value="32"
          show-label
          show-value
        ></kt-progress-bar>
        <kt-meter label="Storage" used="25.8 GB used" total="of 983 GB" value="3"></kt-meter>`,
    ),
  () =>
    card(
      'Account',
      '',
      html`<kt-segmented-control
          label="Section"
          .options=${[
            { value: 'account', label: 'Account', icon: 'user' },
            { value: 'password', label: 'Password', icon: 'key-round' },
          ]}
          value="account"
        ></kt-segmented-control>
        <kt-label-input label="Name"
          ><kt-input .clearable=${false} value="Dana Whitfield"></kt-input
        ></kt-label-input>
        <kt-label-input label="Username"
          ><kt-input .clearable=${false} value="dana"></kt-input
        ></kt-label-input>`,
    ),
  () =>
    card(
      'Schedule a call',
      'We will send an invite to your calendar.',
      html`<div class="showcase-split">
          <kt-label-input label="Day"
            ><kt-date-input locale="en-GB" value="2026-10-12"></kt-date-input
          ></kt-label-input>
          <kt-label-input label="Time"
            ><kt-time-input locale="en-GB" value="14:30" step="15"></kt-time-input
          ></kt-label-input>
        </div>
        <kt-radio-group label="Length" value="30">
          <kt-radio value="15">15 minutes</kt-radio>
          <kt-radio value="30">30 minutes</kt-radio>
          <kt-radio value="60">An hour</kt-radio>
        </kt-radio-group>`,
      html`<kt-button variant="primary" @click=${() => toaster.success('Call booked')}
        >Book the call</kt-button
      >`,
    ),
  () =>
    card(
      'Recent orders',
      '',
      html`<ul class="showcase-list">
        ${[
          ['Acme Corp', '$1,200', 'Paid', 'success'],
          ['Globex', '$860', 'Pending', 'warning'],
          ['Initech', '$2,430', 'Paid', 'success'],
          ['Umbrella', '$310', 'Overdue', 'danger'],
        ].map(
          ([name, total, status, tone]) =>
            html`<li>
              <kt-avatar name=${name} size="small"></kt-avatar>
              <span class="showcase-list-name">${name}</span>
              <span class="showcase-list-total">${total}</span>
              <kt-badge tone=${tone}>${status}</kt-badge>
            </li>`,
        )}
      </ul>`,
    ),
  () =>
    card(
      'Contributors',
      'Built in the open.',
      html`<div class="showcase-row">
        ${[
          'Dana Whitfield',
          'Rowan Ellis',
          'Mei Tanaka',
          'Omar Haddad',
          'Lena Vogel',
          'Ines Duarte',
        ].map((name) => html`<kt-avatar name=${name}></kt-avatar>`)}
        <kt-badge variant="count">312</kt-badge>
      </div>`,
    ),
  () =>
    card(
      'Release checklist',
      '',
      html`<kt-checkbox checked>Changelog written</kt-checkbox>
        <kt-checkbox checked>Tests pass in both themes</kt-checkbox>
        <kt-checkbox>Announce the release</kt-checkbox>
        <div class="showcase-row">
          <kt-badge tone="success">Shipped</kt-badge><kt-badge tone="warning">In review</kt-badge
          ><kt-badge tone="danger">Blocked</kt-badge>
        </div>`,
    ),
  () =>
    card(
      'Log in',
      'Use the email you signed up with.',
      html`<kt-label-input label="Email"
          ><kt-input .clearable=${false} type="email" value="dana@northwind.io"></kt-input
        ></kt-label-input>
        <kt-label-input label="Password"
          ><kt-input .clearable=${false} type="password" value="hunter22"></kt-input
        ></kt-label-input>
        <kt-button variant="primary" @click=${() => toaster.success('Signed in')}
          >Log in</kt-button
        >`,
    ),
  () =>
    card(
      'Upload receipts',
      'PDF or images, 2 MB each.',
      html`<kt-drag-drop accept="image/*,application/pdf" max-size="2097152"></kt-drag-drop>`,
    ),
];

/** How many screens the wall shows, for the copy that introduces it. */
export const SCREEN_COUNT = SCREENS.length;

/** The wall, with the presets that re-theme it. */
export function showcase(rerender: () => void): TemplateResult {
  return html`<div class="showcase">
    <div class="showcase-bar">
      <kt-segmented-control
        size="small"
        label="Theme of the examples"
        .options=${PRESETS.map(({ id, label }) => ({ value: id, label }))}
        .value=${preset}
        @kt-change=${(event: CustomEvent<{ value: string }>) => {
          preset = event.detail.value;
          rerender();
        }}
      ></kt-segmented-control>
      <span class="showcase-caption">Same components, every look</span>
    </div>
    <div
      class="showcase-wall"
      ${ref((wall) => {
        if (wall instanceof HTMLElement) applyPreset(wall);
      })}
    >
      ${SCREENS.map((screen) => screen())}
    </div>
  </div>`;
}
