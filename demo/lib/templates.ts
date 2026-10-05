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
  readonly routes: readonly { readonly path: string; readonly what: string }[];
  /** The files a fork changes first. */
  readonly files: readonly { readonly path: string; readonly what: string }[];
  readonly components: readonly string[];
  /** Screens shot from the live demo; the first is the card's. */
  readonly screens: readonly {
    readonly file: string;
    readonly hash: string;
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
      { file: 'saas-overview.png', hash: '#/', caption: 'The overview' },
      { file: 'saas-customers.png', hash: '#/customers', caption: 'Customers' },
      { file: 'saas-settings.png', hash: '#/settings', caption: 'Settings' },
      { file: 'saas-sign-in.png', hash: '#/sign-in', caption: 'Signing in' },
    ],
    seed: {
      'kanto-saas-session': JSON.stringify({
        name: 'Ada Park',
        email: 'ada@northwind.com',
        welcomed: true,
      }),
    },
  },
];

export const createCommand = (id: string, stack: string): string =>
  `npm create kanto@latest my-app -- --template ${id} --stack ${stack}`;

export const degitCommand = (id: string, stack: string): string =>
  `npx degit MrArnaudMichel/kanto/templates/${id}-${stack} my-app`;

/** The live demo, built beside the site from the template's vanilla stack. */
export const demoHref = (id: string): string => `./templates/${id}/`;
