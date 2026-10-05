/**
 * The templates the site shows — the same list `create-kanto` makes (a test
 * holds the two together). The gallery, each template's page, the home page
 * and the screenshot script all read this.
 */
export interface TemplateEntry {
  /** As in `create-kanto --template` and `templates/<id>-<stack>/`. */
  readonly id: string;
  readonly name: string;
  /** One line, on the gallery's card. */
  readonly summary: string;
  /** Markdown, on the template's page: what it is and how it is made. */
  readonly description: string;
  /** Markdown: what to try in the running demo. */
  readonly tryIt: string;
  /**
   * The running demo, relative to the site: a template's live build
   * (`./templates/saas/#/sign-in`), or a demo of the docs (`./#/app/chat`).
   */
  readonly demo: string;
  /** Its projects exist: `create-kanto` makes it, `templates/<id>-<stack>/` hold it. */
  readonly project: boolean;
  readonly routes: readonly { readonly path: string; readonly what: string }[];
  /** The files a fork changes first. */
  readonly files: readonly { readonly path: string; readonly what: string }[];
  readonly components: readonly string[];
  /** Screens shot from the running demo, by path from the site's root; the first is the card's. */
  readonly screens: readonly {
    readonly file: string;
    readonly path: string;
    readonly caption: string;
  }[];
  /** localStorage set before the screenshots: the demo seen signed in. */
  readonly seed?: Readonly<Record<string, string>>;
}

export const STACKS = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'vanilla', label: 'TypeScript' },
] as const;

export type StackId = (typeof STACKS)[number]['id'];

export const TEMPLATE_CATALOG: readonly TemplateEntry[] = [
  {
    id: 'saas',
    name: 'SaaS',
    summary: 'An invoicing product: sign in, first steps, a dashboard, customers and settings.',
    description: `Northwind sends invoices and chases them. Signing in is faked — any
email and password get in — and the data comes from one module with an async
API over made-up customers and invoices: replace those two files and the
pages do not change.

A new account lands on its first steps before its dashboard; a signed-out
visit to any page goes to sign in.`,
    tryIt: `- Sign in with any email and password — then open a customer from the
  table, and change your name in Settings.
- Search the customers as fast as you type: the last search always wins.
- Delete the workspace — it asks first.`,
    demo: './templates/saas/#/sign-in',
    project: true,
    routes: [
      {
        path: '#/sign-in, #/sign-up',
        what: 'The way in: sign in, create an account, reset a password.',
      },
      { path: '#/welcome', what: 'First steps for a new account.' },
      { path: '#/', what: 'What is billed, paid and late: stats, a chart, the latest invoices.' },
      {
        path: '#/customers',
        what: 'Everyone you bill: search, pages, and a customer in a side panel.',
      },
      { path: '#/settings', what: 'Profile, notifications, and a danger zone that asks first.' },
    ],
    files: [
      { path: 'src/brand.ts', what: 'The brand, in one call.' },
      { path: 'src/data/api.ts', what: 'The data. Call your backend here.' },
      { path: 'src/auth.ts', what: 'Signing in. Call your auth provider here.' },
      {
        path: 'src/content.ts',
        what: 'The navigation, the account menu, the first steps, the tables.',
      },
    ],
    components: [
      'kt-app-shell',
      'kt-sub-menu-navigation',
      'kt-user-menu',
      'kt-auth-form',
      'kt-empty-page',
      'kt-page-header',
      'kt-stat',
      'kt-chart',
      'kt-table',
      'kt-side-panel',
      'kt-description-list',
      'kt-settings-section',
      'kt-confirm-dialog',
      'kt-error-page',
    ],
    screens: [
      { file: 'saas-overview.png', path: 'templates/saas/#/', caption: 'The overview' },
      { file: 'saas-customers.png', path: 'templates/saas/#/customers', caption: 'Customers' },
      { file: 'saas-settings.png', path: 'templates/saas/#/settings', caption: 'Settings' },
      { file: 'saas-sign-in.png', path: 'templates/saas/#/sign-in', caption: 'Signing in' },
    ],
    seed: {
      'kanto-saas-session': JSON.stringify({
        name: 'Ada Park',
        email: 'ada@northwind.com',
        welcomed: true,
      }),
    },
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    summary:
      'An admin console: inbox, customers, files, activity, integrations and nested settings, in one shell.',
    description: `An operations console: a dashboard, a mailbox, a customer table, a file
browser, an audit log, integrations and five settings screens, all hanging off
one shell.`,
    tryIt: `- The sidebar nests three levels deep under **Administration**, and it is
  \`<kt-sub-menu-navigation>\` doing it rather than markup written for this
  screen. Navigate to a nested page and watch the branch open itself.
- **⌘K** anywhere opens the command palette.
- Collapse the sidebar from the top bar: labels are hidden, not clipped.
- On **Customers**, tick some rows to raise the bulk bar, then delete — it asks
  first.`,
    demo: './#/app/console/home',
    project: false,
    routes: [],
    files: [],
    components: [
      'kt-sub-menu-navigation',
      'kt-command-palette',
      'kt-page-header',
      'kt-stat',
      'kt-chart',
      'kt-table',
      'kt-pagination',
      'kt-side-panel',
      'kt-drag-drop',
      'kt-timeline',
      'kt-confirm-dialog',
      'kt-tabs',
    ],
    screens: [{ file: 'dashboard-home.png', path: '#/app/console/home', caption: 'Home' }],
  },
  {
    id: 'landing',
    name: 'Landing',
    summary: "A product's marketing page: a hero, features, pricing, questions and the way in.",
    description: `A marketing page, to check that a system built for data-dense tools can still
say hello: long measure, generous rhythm, one message per band.`,
    tryIt: `- The pricing control really swaps the plans.
- The FAQ is \`<kt-collapsible>\`, a disclosure rather than an accordion —
  opening one answer does not close the one you were comparing it to.`,
    demo: './#/app/landing',
    project: false,
    routes: [],
    files: [],
    components: [
      'kt-header',
      'kt-segmented-control',
      'kt-card',
      'kt-chart',
      'kt-collapsible',
      'kt-input',
      'kt-button',
    ],
    screens: [{ file: 'landing-home.png', path: '#/app/landing', caption: 'The page' }],
  },
  {
    id: 'chat',
    name: 'Chat',
    summary: 'An assistant: threads, answers that stream, sources, tool calls and a composer.',
    description: `An assistant with the parts a real one has: a thread list, sources beside the
answer, tool calls that show their work, and a composer with attachments and a
model picker.`,
    tryIt: `- Ask anything — replies stream a token at a time, and the transcript stays
  pinned to the bottom while they do.
- Open a **tool call** to see the arguments and the result.
- The sources rail on the right follows the turn you are reading.`,
    demo: './#/app/chat',
    project: false,
    routes: [],
    files: [],
    components: [
      'kt-avatar',
      'kt-code',
      'kt-collapsible',
      'kt-select',
      'kt-textarea',
      'kt-skeleton',
      'kt-tooltip',
      'kt-meter',
    ],
    screens: [{ file: 'chat-home.png', path: '#/app/chat', caption: 'A conversation' }],
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    summary: "A person's work: projects to filter, case studies, a career and a contact form.",
    description: `Typography rather than density, one thing said at a time: the third kind of
screen, after the console and the marketing page.`,
    tryIt: `- Filter the work, then open a case study — the panel carries a
  \`<kt-timeline>\`, the same element as the career list on the page.
- The contact form validates before it pretends to send.`,
    demo: './#/app/portfolio',
    project: false,
    routes: [],
    files: [],
    components: [
      'kt-header',
      'kt-toggle-button-group',
      'kt-side-panel',
      'kt-timeline',
      'kt-stat',
      'kt-form',
      'kt-input',
      'kt-textarea',
    ],
    screens: [{ file: 'portfolio-home.png', path: '#/app/portfolio', caption: 'The site' }],
  },
];

export const createCommand = (id: string, stack: string): string =>
  `npm create kanto@latest my-app -- --template ${id} --stack ${stack}`;

export const degitCommand = (id: string, stack: string): string =>
  `npx degit MrArnaudMichel/kanto/templates/${id}-${stack} my-app`;
