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
   * (`./templates/saas/#/sign-in`).
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
  /** localStorage set before the screenshots: the demo seen signed in, a notice answered. */
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
    description: `Northwind's operations console: an overview, a mailbox, customers to filter
and act on, files, an audit log, integrations and five settings screens, all
in one shell — a sidebar three levels deep, a top bar and Cmd+K.

The data comes through one file, \`src/data/api.ts\`: point it at your backend
and the screens do not change. The sidebar, the routes and the commands are one
list in \`src/nav.ts\`.`,
    tryIt: `- **⌘K** (Ctrl+K) anywhere opens the command palette: type a screen, press Enter.
- Open **Settings › Members › Roles**: the sidebar's branch opens itself, three
  levels down.
- On **Customers**, sort by MRR — across every page, not just this one — then
  tick some rows and delete: it asks first.
- Read a message in the **Inbox**: the count on the bell and beside Inbox goes down.
- Collapse the sidebar from the top bar; on a phone it is a drawer.`,
    demo: './templates/dashboard/#/',
    project: true,
    routes: [
      { path: '#/', what: 'The overview: figures, revenue, the latest orders, what happened.' },
      { path: '#/inbox', what: 'A two-pane mailbox, with a message to compose.' },
      {
        path: '#/customers',
        what: 'Filters, sorting and pages, a bulk delete that asks, a customer in a side panel.',
      },
      { path: '#/files, #/activity', what: 'Stored files; the audit log, day by day.' },
      { path: '#/integrations', what: 'What the workspace is wired to, on or off.' },
      {
        path: '#/settings/…',
        what: 'General, Members › People and Roles, Notifications, Security.',
      },
    ],
    files: [
      { path: 'src/data/api.ts', what: "Each screen's data. Call your backend here." },
      { path: 'src/nav.ts', what: 'The sidebar, the routes and the Cmd+K commands.' },
      { path: 'src/brand.ts', what: 'The brand, in one call.' },
      { path: 'src/views.ts', what: 'Filtering, sorting and paging, tested once.' },
    ],
    components: [
      'kt-sub-menu-navigation',
      'kt-command-palette',
      'kt-page-header',
      'kt-stat',
      'kt-chart',
      'kt-table',
      'kt-select',
      'kt-multi-select',
      'kt-side-panel',
      'kt-confirm-dialog',
      'kt-modal',
      'kt-tabs',
      'kt-timeline',
      'kt-toggle-button-group',
      'kt-segmented-control',
      'kt-form',
      'kt-drag-drop',
      'kt-toggle',
      'kt-meter',
    ],
    screens: [
      { file: 'dashboard-home.png', path: 'templates/dashboard/#/', caption: 'The overview' },
      {
        file: 'dashboard-customers.png',
        path: 'templates/dashboard/#/customers',
        caption: 'Customers',
      },
      {
        file: 'dashboard-roles.png',
        path: 'templates/dashboard/#/settings/members/roles',
        caption: 'Settings, three levels down',
      },
    ],
    // The cookie notice answered, so it does not cover the screens.
    seed: { 'northwind-console-cookies': 'accepted' },
  },
  {
    id: 'editor',
    name: 'Editor',
    summary:
      'A document editor: documents in folders, Markdown with a preview, autosave and versions.',
    description: `Northwind Docs: documents in folders on the side, a page to write in
Markdown with a toolbar and a preview beside it, autosave, and a version kept
every minute to go back to.

What is written stays plain text. The toolbar wraps the selection
(\`src/formatting.ts\`), the preview is drawn by a small renderer that puts text
in as text (\`src/markdown.ts\`), and the documents live in this browser until
\`src/store.ts\` talks to your backend.`,
    tryIt: `- Select a word and press **Bold** — or Cmd+B (Ctrl+B).
- Type, wait for **Saved**, reload: your text is there.
- Open **History** after a minute of writing, and restore the older text: it asks
  first, and keeps what you had as a version too.
- Make a **New document**, then delete it — that asks first as well.`,
    demo: './templates/editor/',
    project: true,
    routes: [
      { path: '#/', what: 'The first document.' },
      { path: '#/doc/<id>', what: 'A document: the page, the preview, its history.' },
    ],
    files: [
      { path: 'src/store.ts', what: 'Where documents are kept. Call your backend here.' },
      { path: 'src/content.ts', what: 'The example documents.' },
      { path: 'src/formatting.ts', what: 'What the toolbar does to the text.' },
      { path: 'src/markdown.ts', what: 'How the preview is drawn.' },
    ],
    components: [
      'kt-app-shell',
      'kt-tree',
      'kt-button',
      'kt-tooltip',
      'kt-segmented-control',
      'kt-side-panel',
      'kt-confirm-dialog',
      'kt-empty-state',
      'kt-error-page',
    ],
    screens: [
      { file: 'editor-page.png', path: 'templates/editor/', caption: 'Writing, with the preview' },
      {
        file: 'editor-guide.png',
        path: 'templates/editor/#/doc/writing-guide',
        caption: 'The writing guide',
      },
    ],
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
    summary: 'An assistant: conversations on the side, answers that stream, and a prompt.',
    description: `Atlas, an assistant that answers about Northwind's numbers: conversations
down the side, the transcript, and a prompt — each answer streamed a word at a
time.

The model is one function, \`reply()\` in \`src/model.ts\`: it streams a canned
answer until you point it at your model's streaming API, and nothing else
changes.`,
    tryIt: `- Start a new chat from a suggestion, and watch the answer stream.
- Ask, then switch to another conversation before the answer ends: it lands in
  the conversation it belongs to.
- Narrow the window: the conversations move into the shell's drawer.`,
    demo: './templates/chat/',
    project: true,
    routes: [],
    files: [
      { path: 'src/model.ts', what: 'The model. Call yours here.' },
      { path: 'src/content.ts', what: 'What it says, suggests and knows.' },
      { path: 'src/conversations.ts', what: 'The conversations, as plain data.' },
      { path: 'src/brand.ts', what: 'The brand, in one call.' },
    ],
    components: [
      'kt-app-shell',
      'kt-button',
      'kt-chat-message',
      'kt-prompt-input',
      'kt-empty-state',
    ],
    screens: [
      { file: 'chat-conversation.png', path: 'templates/chat/', caption: 'A conversation' },
      { file: 'chat-new.png', path: 'templates/chat/#new', caption: 'A new chat' },
    ],
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
