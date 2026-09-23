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
  KtBreadcrumb,
  KtChart,
  KtDropdown,
  KtInputMenu,
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
  // Let entrance transitions finish: contrast measured mid-fade is wrong.
  const animations = document.getAnimations();
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
