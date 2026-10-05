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
    description: `Northwind's marketing page — the product of the SaaS template — with every
section one of Kanto's blocks: a hero, the companies that use it, features,
what people say, pricing, questions, a newsletter and the way in.

Every word and every price is in one file, \`src/content.ts\`: rewrite it and
the page is yours.`,
    tryIt: `- Switch the pricing to yearly: the plans change, with what yearly saves.
- Subscribe to the newsletter — and try an \`@example.com\` address, which is
  on the list already.
- Narrow the window: every block stacks, and the header's links move into its
  menu.`,
    demo: './templates/landing/',
    project: true,
    routes: [
      {
        path: '#features, #pricing, #questions, #start',
        what: 'The sections, reached from the header.',
      },
    ],
    files: [
      { path: 'src/content.ts', what: 'Every word and every price.' },
      { path: 'src/brand.ts', what: 'The brand, in one call.' },
      {
        path: 'src/actions.ts',
        what: 'Sign-up and the newsletter. Call your app and email provider here.',
      },
    ],
    components: [
      'kt-header',
      'kt-hero',
      'kt-logo-cloud',
      'kt-feature-grid',
      'kt-testimonials',
      'kt-pricing-table',
      'kt-faq',
      'kt-cta',
      'kt-newsletter',
      'kt-footer',
    ],
    screens: [
      { file: 'landing-top.png', path: 'templates/landing/', caption: 'The top of the page' },
      { file: 'landing-pricing.png', path: 'templates/landing/#pricing', caption: 'Pricing' },
    ],
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
    summary:
      "A person's work: projects to filter, case studies, a career, writing and a contact form.",
    description: `Rowan Ellis's site, on one page: an introduction, a few numbers, selected
work to filter — each project opening into a case study with its outcomes and
its phases — a career on a timeline, writing, and a contact form that says what
is missing before it sends.

Everything it says is in \`src/content.ts\`; the filter and the checks are in
\`src/work.ts\`.`,
    tryIt: `- Filter the work by a tag, then back to everything.
- Open a case study, close it, open another: the panel follows.
- Send the contact form empty first: each field says what it needs.`,
    demo: './templates/portfolio/',
    project: true,
    routes: [
      {
        path: '#work, #career, #writing, #contact',
        what: 'The sections, reached from the header.',
      },
    ],
    files: [
      { path: 'src/content.ts', what: 'Everything the site says.' },
      { path: 'src/brand.ts', what: 'The brand, in one call.' },
      { path: 'src/actions.ts', what: 'The form and the CV. Call your form service here.' },
      { path: 'src/work.ts', what: 'The filter and the checks.' },
    ],
    components: [
      'kt-header',
      'kt-avatar',
      'kt-badge',
      'kt-stat',
      'kt-toggle-button-group',
      'kt-card',
      'kt-empty-state',
      'kt-side-panel',
      'kt-timeline',
      'kt-post-grid',
      'kt-label-input',
      'kt-input',
      'kt-textarea',
      'kt-alert',
      'kt-footer',
    ],
    screens: [
      { file: 'portfolio-top.png', path: 'templates/portfolio/', caption: 'The top of the site' },
      { file: 'portfolio-work.png', path: 'templates/portfolio/#work', caption: 'Selected work' },
    ],
  },
];

export const createCommand = (id: string, stack: string): string =>
  `npm create kanto@latest my-app -- --template ${id} --stack ${stack}`;

export const degitCommand = (id: string, stack: string): string =>
  `npx degit MrArnaudMichel/kanto/templates/${id}-${stack} my-app`;
