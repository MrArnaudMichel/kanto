/**
 * An axe audit of every element, in both themes, in a real browser.
 *
 * Only a rendering engine can answer the questions that matter most here —
 * whether text meets its contrast ratio against the surface it actually lands
 * on, whether a control has an accessible name once the shadow DOM is
 * flattened. The per-element suites check each promise by hand; this is the
 * net under all of them.
 */
import axe from 'axe-core';
import { afterEach, chai, describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../styles.css';
import '../index.js';
import type {
  KtBlogPost,
  KtPostGrid,
  KtFaq,
  KtTestimonials,
  KtPricingTable,
  KtFeatureGrid,
  KtAuthForm,
  KtTour,
  KtTree,
  KtUserMenu,
  KtAvatarGroup,
  KtDescriptionList,
  KtFooter,
  KtSteps,
  KtCommandPalette,
  KtBreadcrumb,
  KtChart,
  KtDropdown,
  KtInputMenu,
  KtMultiSelect,
  KtMeter,
  KtSegmentedControl,
  KtSelect,
  KtSplitButton,
  KtSubMenuNavigation,
  KtTable,
  KtTabs,
} from 'kanto-ds';

interface Case {
  markup: string;
  /** Sets the data an element takes as properties. */
  setup?: (element: HTMLElement) => void;
}

const OPTIONS = [
  { id: 'fr', label: 'France' },
  { id: 'be', label: 'Belgium' },
];

const CASES: Record<string, Case> = {
  'kt-avatar': { markup: '<kt-avatar name="Emma Davis" status="online"></kt-avatar>' },
  'kt-badge': { markup: '<kt-badge variant="success">Paid</kt-badge>' },
  'kt-button': { markup: '<kt-button>Save</kt-button>' },
  'kt-button (icon only)': { markup: '<kt-button icon="plus" label="Add"></kt-button>' },
  'kt-split-button': {
    markup: '<kt-split-button>Save</kt-split-button>',
    setup: (el) => {
      (el as KtSplitButton).items = [{ id: 'copy', label: 'Save a copy' }];
    },
  },
  'kt-card': {
    markup: '<kt-card><h6 slot="header">Recent</h6><p>Body</p></kt-card>',
  },
  'kt-code': { markup: '<kt-code language="js" copy>const total = items.length;</kt-code>' },
  'kt-icon': { markup: '<kt-icon name="check" label="Done"></kt-icon>' },
  'kt-kbd': { markup: '<kt-kbd>⌘</kt-kbd>' },
  'kt-chart': {
    markup: '<kt-chart type="bar" label="Revenue by month" height="220"></kt-chart>',
    setup: (el) => {
      const chart = el as KtChart;
      chart.labels = ['Jan', 'Feb', 'Mar'];
      chart.series = [{ name: 'Revenue', values: [42, 58, 36] }];
    },
  },
  'kt-meter': {
    markup: '<kt-meter label="Storage" max="100"></kt-meter>',
    setup: (el) => {
      (el as KtMeter).segments = [
        { label: 'Documents', value: 16 },
        { label: 'Photos', value: 4 },
      ];
    },
  },
  'kt-pagination': { markup: '<kt-pagination page="2" total-pages="7"></kt-pagination>' },
  'kt-stat': { markup: '<kt-stat label="Revenue" value="$292,342"></kt-stat>' },
  'kt-table': {
    markup: '<kt-table label="Transactions"></kt-table>',
    setup: (el) => {
      const table = el as KtTable;
      table.columns = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'amount', label: 'Amount', align: 'right' },
      ];
      table.data = [
        { name: 'Acme', amount: '$120' },
        { name: 'Globex', amount: '$80' },
      ];
    },
  },
  'kt-timeline': {
    markup: `<kt-timeline>
      <kt-timeline-item heading="Deployed" time="09:24" variant="success">Build 4210.</kt-timeline-item>
      <kt-timeline-item heading="Branch opened" time="08:41"></kt-timeline-item>
    </kt-timeline>`,
  },
  'kt-alert': {
    markup:
      '<kt-alert variant="warning" heading="Storage almost full" description="88% used." dismissible></kt-alert>',
  },
  'kt-empty-state': {
    markup:
      '<kt-empty-state icon="inbox" heading="Nothing here" description="New messages appear here."></kt-empty-state>',
  },
  'kt-progress-bar': {
    markup:
      '<kt-progress-bar value="64" show-value show-label label="Importing"></kt-progress-bar>',
  },
  'kt-skeleton': { markup: '<kt-skeleton count="2"></kt-skeleton>' },
  'kt-toast': {
    markup:
      '<kt-toast variant="success" heading="Saved" description="All changes kept."></kt-toast>',
  },
  'kt-tooltip': { markup: '<kt-tooltip text="Copy the link"><button>Copy</button></kt-tooltip>' },
  'kt-drag-drop': { markup: '<kt-drag-drop name="files"></kt-drag-drop>' },
  'kt-form': {
    markup: `<kt-form heading="Identity" description="How we address you.">
      <kt-label-input label="Company"><kt-input name="company"></kt-input></kt-label-input>
    </kt-form>`,
  },
  'kt-input': { markup: '<kt-input label="Email address" type="email"></kt-input>' },
  'kt-input (error)': { markup: '<kt-input label="Email" error="Enter an email."></kt-input>' },
  'kt-input-menu': {
    markup: '<kt-input-menu label="Country" placeholder="Search"></kt-input-menu>',
    setup: (el) => {
      (el as KtInputMenu).options = OPTIONS;
    },
  },
  'kt-multi-select': {
    markup: '<kt-multi-select label="Countries" placeholder="Search"></kt-multi-select>',
    setup: (el) => {
      (el as KtMultiSelect).options = OPTIONS;
      (el as KtMultiSelect).value = ['fr'];
    },
  },
  'kt-label-input': {
    markup:
      '<kt-label-input label="Email" required><kt-input type="email"></kt-input></kt-label-input>',
  },
  'kt-select': {
    markup: '<kt-select label="Country"></kt-select>',
    setup: (el) => {
      (el as KtSelect).options = OPTIONS;
    },
  },
  'kt-textarea': { markup: '<kt-textarea label="Message"></kt-textarea>' },
  'kt-checkbox': { markup: '<kt-checkbox>Send me updates</kt-checkbox>' },
  'kt-calendar': {
    markup: '<kt-calendar locale="en-GB" value="2026-09-25" min="2026-09-10"></kt-calendar>',
  },
  'kt-calendar period': {
    markup: '<kt-calendar range locale="en-GB" value="2026-09-05/2026-09-12"></kt-calendar>',
  },
  'kt-calendar month and year': {
    markup:
      '<kt-calendar locale="en-GB" value="2026-09-25" min="1990-03-01" max="2030-12-31"></kt-calendar>',
    // Rendered by the time setup runs: open the panel before the audit.
    setup: (el) => el.shadowRoot!.querySelector<HTMLElement>('.title')!.click(),
  },
  'kt-date-input': {
    markup: '<kt-date-input label="Due date" locale="en-GB" value="2026-09-25"></kt-date-input>',
  },
  'kt-date-input empty': {
    markup: '<kt-date-input label="Due date" locale="en-GB" required></kt-date-input>',
  },
  'kt-date-input calendar (open)': {
    markup:
      '<kt-date-input calendar label="Due date" locale="en-GB" value="2026-09-25"></kt-date-input>',
    setup: (el) => el.shadowRoot!.querySelector<HTMLElement>('.trigger')!.click(),
  },
  'kt-time-input': {
    markup: '<kt-time-input label="Starts at" locale="en-GB" value="14:30"></kt-time-input>',
  },
  'kt-time-input 12-hour with seconds': {
    markup:
      '<kt-time-input label="Starts at" locale="en-US" seconds value="14:30:05"></kt-time-input>',
  },
  'kt-date-picker': {
    markup: '<kt-date-picker label="Due date" locale="en-GB" value="2026-09-25"></kt-date-picker>',
  },
  'kt-date-picker (open)': {
    markup:
      '<kt-date-picker label="Due date" locale="en-GB" value="2026-09-25" min="2026-09-10"></kt-date-picker>',
    setup: (el) => el.shadowRoot!.querySelector<HTMLElement>('.trigger')!.click(),
  },
  'kt-date-picker period (open)': {
    markup:
      '<kt-date-picker range label="Report period" locale="en-GB" value="2026-09-01/2026-09-25"></kt-date-picker>',
    setup: (el) => el.shadowRoot!.querySelector<HTMLElement>('.trigger')!.click(),
  },
  'kt-date-picker (open period)': {
    markup:
      '<kt-date-picker range label="Period" locale="en-GB" value="2026-09-05/2026-09-12"></kt-date-picker>',
    setup: (el) => el.shadowRoot!.querySelector<HTMLElement>('.trigger')!.click(),
  },
  'kt-checkbox checked': { markup: '<kt-checkbox checked>Send me updates</kt-checkbox>' },
  'kt-checkbox indeterminate': { markup: '<kt-checkbox indeterminate>Select all</kt-checkbox>' },
  'kt-checkbox (label property)': { markup: '<kt-checkbox label="Select row"></kt-checkbox>' },
  'kt-checkbox (error)': {
    markup: '<kt-checkbox error="Accept the terms to continue">I accept the terms</kt-checkbox>',
  },
  'kt-checkbox disabled': { markup: '<kt-checkbox disabled checked>Unavailable</kt-checkbox>' },
  'kt-radio-group': {
    markup: `<kt-radio-group label="Billing" value="monthly">
      <kt-radio value="monthly">Monthly</kt-radio>
      <kt-radio value="yearly">Yearly</kt-radio>
      <kt-radio value="custom" disabled>Custom contract</kt-radio>
    </kt-radio-group>`,
  },
  'kt-radio-group (error)': {
    markup: `<kt-radio-group label="Plan" error="Choose a plan">
      <kt-radio value="free">Free</kt-radio>
      <kt-radio value="pro">Pro</kt-radio>
    </kt-radio-group>`,
  },
  'kt-toggle': { markup: '<kt-toggle>Notifications</kt-toggle>' },
  'kt-breadcrumb': {
    markup: '<kt-breadcrumb></kt-breadcrumb>',
    setup: (el) => {
      (el as KtBreadcrumb).items = [{ label: 'Home', href: '/' }, { label: 'Entity 4812' }];
    },
  },
  'kt-header': {
    markup: `<kt-header>
      <span slot="brand">KANTO</span>
      <nav aria-label="Main"><a href="/docs">Docs</a></nav>
    </kt-header>`,
  },
  'kt-prompt-input': {
    markup:
      '<kt-prompt-input placeholder="Ask anything" value="Summarise this week"></kt-prompt-input>',
  },
  'kt-prompt-input, disabled': {
    markup: '<kt-prompt-input disabled placeholder="Ask anything"></kt-prompt-input>',
  },
  'kt-chat-message': {
    markup: `<div>
      <kt-chat-message from="user" name="Dana">What changed this week?</kt-chat-message>
      <kt-chat-message name="Northwind AI" time="09:41" datetime="2026-10-04T09:41">
        <p>Revenue rose 12%.</p>
        <kt-button slot="actions" size="small" variant="text" icon="copy">Copy</kt-button>
      </kt-chat-message>
    </div>`,
  },
  'kt-chat-message, thinking and streaming': {
    markup: `<div>
      <kt-chat-message name="Northwind AI" thinking></kt-chat-message>
      <kt-chat-message name="Northwind AI" streaming>Revenue rose</kt-chat-message>
    </div>`,
  },
  'kt-app-shell': {
    markup: `<kt-app-shell style="height: 320px">
      <strong slot="header">Northwind</strong>
      <nav slot="sidebar" aria-label="Pages"><a href="#">Overview</a></nav>
      <h1>Overview</h1>
    </kt-app-shell>`,
  },
  'kt-app-shell, narrow with the drawer open': {
    markup: `<kt-app-shell sidebar-open style="height: 320px; width: 500px">
      <strong slot="header">Northwind</strong>
      <nav slot="sidebar" aria-label="Pages"><a href="#">Overview</a></nav>
      <h1>Overview</h1>
    </kt-app-shell>`,
  },
  'kt-description-list': {
    markup: '<kt-description-list label="Invoice" bordered></kt-description-list>',
    setup: (el) => {
      (el as KtDescriptionList).items = [
        { term: 'Invoice', detail: 'INV-2041' },
        { term: 'Customer', detail: 'Acme Corp' },
        { term: 'Purchase order', detail: '' },
      ];
    },
  },
  'kt-description-list, stacked': {
    markup:
      '<kt-description-list label="Invoice" layout="stacked" columns="3"></kt-description-list>',
    setup: (el) => {
      (el as KtDescriptionList).items = [
        { term: 'Invoice', detail: 'INV-2041' },
        { term: 'Customer', detail: 'Acme Corp' },
        { term: 'Purchase order', detail: '' },
      ];
    },
  },
  'kt-avatar-group': {
    markup: '<kt-avatar-group label="Project members" max="3"></kt-avatar-group>',
    setup: (el) => {
      (el as KtAvatarGroup).people = [
        'Dana Whitfield',
        'Hank Scorpio',
        'Bill Lumbergh',
        'Gavin Belson',
        'Alice Abernathy',
      ].map((name) => ({ name }));
    },
  },
  'kt-copy-button': {
    markup: `<div>
      <kt-copy-button value="npm install kanto-ds"></kt-copy-button>
      <kt-copy-button value="sk_live" icon-only label="Copy the API key"></kt-copy-button>
    </div>`,
  },
  'kt-otp-input': {
    markup: '<kt-otp-input label="Verification code" value="482"></kt-otp-input>',
  },
  'kt-otp-input in error': {
    markup:
      '<kt-otp-input label="Verification code" value="482913" error="That code has expired."></kt-otp-input>',
  },
  'kt-accordion': {
    markup: `<kt-accordion>
      <kt-collapsible heading="Shipping" open>Three to five days.</kt-collapsible>
      <kt-collapsible heading="Returns">Thirty days.</kt-collapsible>
    </kt-accordion>`,
  },
  'kt-user-menu': {
    markup:
      '<kt-user-menu name="Dana Whitfield" email="dana@northwind.io" show-name></kt-user-menu>',
    setup: (el) => {
      (el as KtUserMenu).items = [
        { id: 'profile', label: 'Profile', icon: 'user' },
        { id: 'signout', label: 'Sign out', separator: true, danger: true },
      ];
    },
  },
  'kt-user-menu (open)': {
    markup: '<kt-user-menu name="Dana Whitfield" email="dana@northwind.io"></kt-user-menu>',
    setup: (el) => {
      (el as KtUserMenu).items = [
        { id: 'profile', label: 'Profile', icon: 'user' },
        { id: 'signout', label: 'Sign out', separator: true, danger: true },
      ];
      (el as KtUserMenu).show();
    },
  },
  'kt-tree': {
    markup: '<kt-tree label="Files" selected="index"></kt-tree>',
    setup: (el) => {
      (el as KtTree).items = [
        {
          id: 'src',
          label: 'src',
          icon: 'folder',
          children: [{ id: 'index', label: 'index.ts', icon: 'file' }],
        },
        { id: 'readme', label: 'README.md', icon: 'file-text' },
      ];
      (el as KtTree).expanded = ['src'];
    },
  },
  'kt-color-picker': {
    markup: '<kt-color-picker label="Label colour" value="#1f6feb"></kt-color-picker>',
  },
  'kt-color-picker, a free colour': {
    markup: '<kt-color-picker label="Label colour" value="#e11d48"></kt-color-picker>',
  },
  'kt-tour (started)': {
    markup: '<kt-tour></kt-tour>',
    setup: (el) => {
      (el as KtTour).steps = [
        { title: 'Search everything', body: 'Find any invoice or customer.' },
        { title: 'Invite your team', body: 'Work on invoices together.' },
      ];
      (el as KtTour).start();
    },
  },
  'kt-auth-form': {
    markup: '<kt-auth-form remember></kt-auth-form>',
    setup: (el) => {
      (el as KtAuthForm).providers = [{ id: 'github', label: 'Continue with GitHub' }];
    },
  },
  'kt-auth-form, signing up with an error': {
    markup: '<kt-auth-form mode="sign-up"></kt-auth-form>',
    setup: (el) => {
      (el as KtAuthForm).error = 'That email already has an account.';
    },
  },
  'kt-auth-form, a code': {
    markup: '<kt-auth-form mode="code" heading-level="2"></kt-auth-form>',
  },
  'kt-error-page': {
    markup: '<kt-error-page></kt-error-page>',
  },
  'kt-error-page, an error': {
    markup:
      '<kt-error-page kind="error" heading-level="2"><span>Request id: 7f3a9c</span></kt-error-page>',
  },
  'kt-hero': {
    markup: `<kt-hero heading="Invoices that pay themselves" lead="Send, chase and reconcile." layout="split">
      <a slot="announcement" href="#">New: recurring invoices</a>
      <kt-button slot="actions">Start free</kt-button>
      <span slot="note">No card needed.</span>
    </kt-hero>`,
  },
  'kt-feature-grid': {
    markup:
      '<kt-feature-grid heading="Why teams switch" lead="Less chasing." variant="card"></kt-feature-grid>',
    setup: (el) => {
      (el as KtFeatureGrid).features = [
        { icon: 'send', title: 'Sent in a second', description: 'From the quote.' },
        { title: 'Reconciled', description: 'Matched to the bank.', href: '#' },
      ];
    },
  },
  'kt-cta': {
    markup: `<kt-cta heading="Start sending invoices" lead="Your first invoice goes out in two minutes.">
      <kt-button slot="actions">Start free</kt-button>
      <span slot="note">No card needed.</span>
    </kt-cta>`,
  },
  'kt-cta inline': {
    markup: `<kt-cta heading="Start sending invoices" layout="inline" variant="plain" align="start">
      <kt-button slot="actions">Start free</kt-button>
    </kt-cta>`,
  },
  'kt-pricing-table': {
    markup: '<kt-pricing-table heading="Pricing" yearly-note="Two months free"></kt-pricing-table>',
    setup: (el) => {
      (el as KtPricingTable).plans = [
        {
          id: 'starter',
          name: 'Starter',
          price: { monthly: 0, yearly: 0 },
          features: ['10 invoices'],
        },
        {
          id: 'team',
          name: 'Team',
          description: 'For a team.',
          price: { monthly: 29, yearly: 290 },
          features: ['Unlimited'],
          featured: true,
        },
        {
          id: 'scale',
          name: 'Scale',
          price: 'Custom',
          features: ['SSO'],
          href: '#',
          action: 'Talk to sales',
        },
      ];
    },
  },
  'kt-testimonials': {
    markup: '<kt-testimonials heading="What teams say"></kt-testimonials>',
    setup: (el) => {
      (el as KtTestimonials).testimonials = [
        { quote: 'We closed the month in a day.', name: 'Ada Park', role: 'CFO, Northwind' },
        { quote: 'Reminders I never have to write.', name: 'Sam Ortiz' },
      ];
    },
  },
  'kt-testimonials single': {
    markup: '<kt-testimonials layout="single"></kt-testimonials>',
    setup: (el) => {
      (el as KtTestimonials).testimonials = [
        { quote: 'We closed the month in a day.', name: 'Ada Park', role: 'CFO, Northwind' },
      ];
    },
  },
  'kt-logo-cloud': {
    markup: `<kt-logo-cloud heading="Trusted by finance teams at">
      <svg role="img" aria-label="Northwind" viewBox="0 0 120 28"><circle cx="12" cy="14" r="10" /></svg>
      <img alt="Kiln" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" />
    </kt-logo-cloud>`,
  },
  'kt-faq': {
    markup:
      '<kt-faq heading="Questions" layout="split" open-first><span slot="note">Something else? <a href="#">Ask us</a>.</span></kt-faq>',
    setup: (el) => {
      (el as KtFaq).items = [
        { question: 'Can I cancel any time?', answer: 'Yes, from Settings.' },
        { question: 'Do you take card payments?', answer: 'Cards and bank transfers.' },
      ];
    },
  },
  'kt-post-grid': {
    markup:
      '<kt-post-grid heading="From the blog"><a slot="more" href="#">Every post</a></kt-post-grid>',
    setup: (el) => {
      (el as KtPostGrid).posts = [
        {
          title: 'Closing the month in a day',
          href: '#',
          excerpt: 'What changed.',
          date: '2026-09-14',
          author: { name: 'Ada Park' },
          tags: ['Finance'],
        },
        { title: 'Reminders that get paid', href: '#', date: '2026-08-02' },
      ];
    },
  },
  'kt-blog-post': {
    markup: `<kt-blog-post heading="Closing the month in a day" lead="What changed." author="Ada Park" author-role="CFO" date="2026-09-14" back-href="#" heading-level="2">
      <p>For years, the first week of every month was the close.</p>
      <h3>What we changed</h3>
      <p>We let the bank feed match itself.</p>
      <p slot="end">Filed under Finance.</p>
    </kt-blog-post>`,
    setup: (el) => {
      (el as KtBlogPost).tags = ['Finance'];
    },
  },
  'kt-newsletter': {
    markup: `<kt-newsletter heading="Notes, monthly" lead="What we shipped.">
      <span slot="note">One email a month.</span>
    </kt-newsletter>`,
  },
  'kt-newsletter inline': {
    markup:
      '<kt-newsletter heading="Notes, monthly" layout="inline" variant="plain" align="start"></kt-newsletter>',
  },
  'kt-settings-section': {
    markup: `<div>
      <kt-settings-section heading="Profile" description="How others see you.">
        <kt-label-input label="Name"><kt-input value="Ada Park"></kt-input></kt-label-input>
        <span slot="note">Saved 2 minutes ago</span>
        <kt-button slot="actions">Save</kt-button>
      </kt-settings-section>
      <kt-settings-section danger heading="Delete workspace" description="Everything in it goes.">
        <kt-button slot="actions" variant="delete">Delete workspace</kt-button>
      </kt-settings-section>
    </div>`,
  },
  'kt-footer': {
    markup: `<kt-footer label="Site">
      <a slot="brand" href="/">ACME</a>
      Invoicing for small teams.
      <span slot="legal">© 2026 Acme</span>
    </kt-footer>`,
    setup: (el) => {
      (el as KtFooter).columns = [
        { heading: 'Product', links: [{ label: 'Pricing', href: '/pricing' }] },
        {
          heading: 'Company',
          links: [{ label: 'GitHub', href: 'https://github.com/acme', external: true }],
        },
      ];
    },
  },
  'kt-footer (simple)': {
    markup: `<kt-footer label="Site" variant="simple"><a slot="brand" href="/">ACME</a></kt-footer>`,
    setup: (el) => {
      (el as KtFooter).columns = [
        { heading: 'Product', links: [{ label: 'Pricing', href: '/pricing' }] },
        {
          heading: 'Company',
          links: [{ label: 'GitHub', href: 'https://github.com/acme', external: true }],
        },
      ];
    },
  },
  'kt-page-header': {
    markup: '<kt-page-header eyebrow="Dashboard" heading="Good evening"></kt-page-header>',
  },
  'kt-segmented-control': {
    markup: '<kt-segmented-control label="Range" value="day"></kt-segmented-control>',
    setup: (el) => {
      (el as KtSegmentedControl).options = [
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
      ];
    },
  },
  'kt-sub-menu-navigation': {
    markup: '<kt-sub-menu-navigation></kt-sub-menu-navigation>',
    setup: (el) => {
      (el as KtSubMenuNavigation).sections = [
        { title: 'Forms', items: [{ label: 'Input', href: '/input' }] },
      ];
    },
  },
  'kt-tabs': {
    markup: '<kt-tabs label="Sections" value="usage"></kt-tabs>',
    setup: (el) => {
      (el as KtTabs).tabs = [
        { value: 'usage', label: 'Usage' },
        { value: 'api', label: 'API' },
      ];
    },
  },
  'kt-toggle-button-group': {
    markup: `<kt-toggle-button-group label="View">
      <kt-toggle-button value="list">List</kt-toggle-button>
      <kt-toggle-button value="grid">Grid</kt-toggle-button>
    </kt-toggle-button-group>`,
  },
  'kt-collapsible': { markup: '<kt-collapsible heading="Notifications">Body</kt-collapsible>' },
  'kt-dropdown': {
    markup:
      '<kt-dropdown><kt-button slot="trigger" icon="menu" label="Actions"></kt-button></kt-dropdown>',
    setup: (el) => {
      (el as KtDropdown).options = OPTIONS;
    },
  },
  'kt-command-palette (open)': {
    markup: '<kt-command-palette open></kt-command-palette>',
    setup: (el) => {
      (el as KtCommandPalette).commands = [
        { id: 'new', label: 'New invoice', group: 'Create', shortcut: 'mod i' },
        { id: 'settings', label: 'Open settings', group: 'Navigate', icon: 'settings' },
        { id: 'export', label: 'Export as CSV', group: 'Navigate', disabled: true },
      ];
    },
  },
  'kt-command-palette (no matches)': {
    markup: '<kt-command-palette open></kt-command-palette>',
    setup: (el) => {
      (el as KtCommandPalette).commands = [{ id: 'new', label: 'New invoice' }];
      const input = el.shadowRoot!.querySelector('input')!;
      input.value = 'zzz';
      input.dispatchEvent(new Event('input'));
    },
  },
  'kt-number-input': {
    markup: '<kt-number-input label="Seats" min="1" max="50" value="5"></kt-number-input>',
  },
  'kt-number-input in error': {
    markup: '<kt-number-input label="Seats" value="60" error="At most 50"></kt-number-input>',
  },
  'kt-slider': { markup: '<kt-slider label="Volume" value="40" show-value></kt-slider>' },
  'kt-slider range': {
    markup: '<kt-slider range label="Price" value="20/80" show-value></kt-slider>',
  },
  'kt-steps': {
    markup: '<kt-steps label="Sign-up" current="team" navigable></kt-steps>',
    setup: (el) => {
      (el as KtSteps).steps = [
        { id: 'account', label: 'Account' },
        { id: 'billing', label: 'Billing', description: 'Card or invoice', error: false },
        { id: 'team', label: 'Team' },
      ];
    },
  },
  'kt-steps with an error, vertical': {
    markup: '<kt-steps label="Sign-up" current="team" orientation="vertical"></kt-steps>',
    setup: (el) => {
      (el as KtSteps).steps = [
        { id: 'account', label: 'Account' },
        { id: 'billing', label: 'Billing', description: 'Card or invoice', error: true },
        { id: 'team', label: 'Team' },
      ];
    },
  },
  'kt-modal': { markup: '<kt-modal open heading="Edit entity"><p>Body</p></kt-modal>' },
  'kt-confirm-dialog': {
    markup: '<kt-confirm-dialog open message="Delete it?"></kt-confirm-dialog>',
  },
  'kt-side-panel': {
    markup: '<kt-side-panel open heading="Entity 4812"><p>Details</p></kt-side-panel>',
  },
};

/*
 * Every colour a variant can put text in. The palette is where contrast is won
 * or lost, so each tone gets its own case rather than one sample per element.
 */
const TONES = ['primary', 'success', 'warning', 'danger', 'info'] as const;
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

for (const variant of BUTTON_VARIANTS) {
  CASES[`kt-button ${variant}`] = { markup: `<kt-button variant="${variant}">Save</kt-button>` };
}
for (const tone of ['neutral', ...TONES]) {
  CASES[`kt-badge ${tone}`] = { markup: `<kt-badge tone="${tone}">Paid</kt-badge>` };
  CASES[`kt-badge count ${tone}`] = {
    markup: `<kt-badge variant="count" tone="${tone}">12</kt-badge>`,
  };
}
CASES['kt-badge category'] = { markup: '<kt-badge variant="category">Infrastructure</kt-badge>' };
for (const variant of ['info', 'success', 'warning', 'danger', 'neutral']) {
  CASES[`kt-alert ${variant}`] = {
    markup: `<kt-alert variant="${variant}" heading="Heads up" description="Something changed."></kt-alert>`,
  };
}
// An alert's action button sits on the alert's own tint, a step away from
// the surfaces a button is tuned for.
for (const variant of ['info', 'success', 'warning', 'danger']) {
  CASES[`kt-alert ${variant} with an action`] = {
    markup: `<kt-alert variant="${variant}" heading="Heads up" description="Something changed."><kt-button slot="actions" size="small" variant="${variant}">Review</kt-button></kt-alert>`,
  };
  CASES[`kt-alert ${variant} with an action, on a card`] = {
    markup: `<div style="padding: 16px; background: var(--surface-card)"><kt-alert variant="${variant}" heading="Heads up" description="Something changed."><kt-button slot="actions" size="small" variant="${variant}">Review</kt-button></kt-alert></div>`,
  };
}
for (const variant of ['success', 'information', 'warning', 'error']) {
  CASES[`kt-toast ${variant}`] = {
    markup: `<kt-toast variant="${variant}" heading="Saved" description="All changes kept."></kt-toast>`,
  };
}
// The hue is the name's char-code sum modulo eight: A to H reach all eight.
for (const letter of 'ABCDEFGH') {
  CASES[`kt-avatar hue of ${letter}`] = { markup: `<kt-avatar name="${letter}"></kt-avatar>` };
}

// A violation report is only useful whole.
chai.config.truncateThreshold = 0;

/** Page-level rules; each case is a fragment, not a page. */
const PAGE_RULES = ['region', 'landmark-one-main', 'page-has-heading-one'];

async function audit(element: HTMLElement): Promise<string[]> {
  await settle(element);
  // Let entrance transitions finish: contrast measured mid-fade is wrong. A
  // transition from @starting-style only exists once a frame has styled the
  // element, so wait for two frames before collecting them.
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  // document.getAnimations() leaves out shadow trees, where a component's own
  // transitions run: ask each shadow root as well.
  const roots: DocumentOrShadowRoot[] = [document];
  const walk = (root: Document | ShadowRoot) =>
    root.querySelectorAll('*').forEach((node) => {
      if (node.shadowRoot) {
        roots.push(node.shadowRoot);
        walk(node.shadowRoot);
      }
    });
  walk(document);
  // A loop — a skeleton's shimmer — never finishes; only entrances are awaited.
  const animations = roots
    .flatMap((root) => root.getAnimations())
    .filter((animation) => animation.effect?.getTiming().iterations !== Infinity);
  await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));

  const results = await axe.run(element.parentElement!, {
    resultTypes: ['violations'],
    rules: Object.fromEntries(PAGE_RULES.map((rule) => [rule, { enabled: false }])),
  });
  return results.violations.flatMap((violation) =>
    violation.nodes.map(
      (node) =>
        `${violation.id} (${violation.impact}) at ${node.target.join(' > ')}: ${
          node.failureSummary?.replace(/\s+/g, ' ') ?? violation.help
        }`,
    ),
  );
}

afterEach(() => {
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.accent;
});

describe.each(['dark', 'light'])('accessibility, %s theme', (theme) => {
  it.each(Object.entries(CASES))('%s has no axe violations', async (_, { markup, setup }) => {
    if (theme === 'light') document.documentElement.dataset.theme = 'light';

    const element = await fixture<HTMLElement>(markup);
    setup?.(element);

    // Joined, so a failure prints every violation rather than "Array(2)".
    expect((await audit(element)).join('\n')).toBe('');
  });
});

/*
 * The accent is a choice now, so contrast has to hold for the presets too —
 * on the elements that paint it: fills, text, rings, selected states.
 */
const ACCENT_CASES = Object.entries(CASES).filter(([name]) =>
  /^kt-(button|badge|calendar|checkbox|toggle|tabs|segmented-control|date-picker|pagination|radio)/.test(
    name,
  ),
);

describe.each(['blue', 'green', 'orange'])('accessibility, %s accent', (accent) => {
  describe.each(['dark', 'light'])('%s theme', (theme) => {
    it.each(ACCENT_CASES)('%s has no axe violations', async (_, { markup, setup }) => {
      document.documentElement.dataset.accent = accent;
      if (theme === 'light') document.documentElement.dataset.theme = 'light';

      const element = await fixture<HTMLElement>(markup);
      setup?.(element);

      expect((await audit(element)).join('\n')).toBe('');
    });
  });
});

describe.each([
  { density: 'compact', textSize: 'small', radius: 'sharp' },
  { density: 'comfortable', textSize: 'large', radius: 'round' },
])('accessibility, appearance %o', (appearance) => {
  afterEach(() => {
    for (const key of Object.keys(appearance)) delete document.documentElement.dataset[key];
  });
  it.each(Object.entries(CASES))('%s has no axe violations', async (_, { markup, setup }) => {
    Object.assign(document.documentElement.dataset, appearance);
    const element = await fixture<HTMLElement>(markup);
    setup?.(element);
    expect((await audit(element)).join('\n')).toBe('');
  });
});
