/**
 * Kanto SaaS Pro, as the site sells it: what changes before launch sits at the
 * top — the price, the checkout, the live demo — and the page reads the rest.
 * Kanto SaaS Pro is a separate, paid product: no code of it lives here, only
 * its words and its screens.
 */

export interface ProOffer {
  name: string;
  price: number;
  checkout: string;
  demo: string;
  repository: string;
}

export const PRO: ProOffer = {
  name: 'Kanto SaaS Pro',
  /** The price, once, in euros. */
  price: 149,
  /**
   * Polar's checkout for the product (it grants access to the private
   * repository). Empty until the shop opens: the page then says so, and Buy
   * waits.
   */
  checkout: 'https://buy.polar.sh/polar_cl_Z0l6RSYAcEAhXv40w4topbl5KvyoCuxpFqiPh2Skift',
  /** The live demo, once deployed. Empty: no demo link is drawn. */
  demo: 'https://demo.kanto.arnaudmichel.fr',
  /** The private repository a purchase opens (Polar's GitHub repository access). */
  repository: 'kanto-ds/kanto-saas-pro',
};

/** The screens, as the live demo's `npm run shots` takes them, in public/pro/. */
export const PRO_SCREENS = [
  { file: 'home', caption: 'The workspace, on the example product' },
  { file: 'invoice', caption: 'An invoice, as the customer receives it' },
  { file: 'billing', caption: 'Plans, trials, receipts' },
  { file: 'messages', caption: 'Team threads and support' },
  { file: 'admin', caption: 'The admin panel: revenue and sign-ups' },
  { file: 'admin-workspace', caption: 'A workspace, seen by its staff' },
  { file: 'stack', caption: 'The stack: one answer each' },
  { file: 'sign-in', caption: 'Sign-in, with Google and GitHub' },
] as const;

/** The same app on a phone, side by side. */
export const PRO_PHONES = [
  { file: 'home-phone', caption: 'The workspace' },
  { file: 'invoice-phone', caption: 'An invoice' },
] as const;

/** What is done before the buyer writes a line. */
export const PRO_DONE: readonly { icon: string; title: string; body: string }[] = [
  {
    icon: 'user-plus',
    title: 'Accounts',
    body: 'Passwords, magic links, two-factor, confirmed addresses, and sign-in with Google or GitHub.',
  },
  {
    icon: 'users',
    title: 'Workspaces and roles',
    body: 'Invitations, owners, admins, members and viewers — enforced on the server, hidden in the app.',
  },
  {
    icon: 'credit-card',
    title: 'Plans and billing',
    body: 'Stripe or Lemon Squeezy: trials, limits per plan, failed payments and their grace, taxes, receipts.',
  },
  {
    icon: 'layout-dashboard',
    title: 'An admin panel',
    body: 'Revenue and sign-ups, signing in as someone with an audit, plans, the landing, flags and announcements.',
  },
  {
    icon: 'send',
    title: 'Messages and support',
    body: 'Live team threads with files and mentions, and a support inbox your staff answer from.',
  },
  {
    icon: 'key-round',
    title: 'An API',
    body: 'Keys with scopes, and an endpoint for every resource you declare.',
  },
  {
    icon: 'layers',
    title: 'Your database',
    body: 'SQLite (a file or Turso), Postgres (Neon, Supabase) or MongoDB — the same code on each.',
  },
  {
    icon: 'scroll-text',
    title: 'A landing and legal pages',
    body: 'Prerendered for search engines, its words editable from the panel without a deploy.',
  },
];

/** The free things and the paid one, row by row. */
export const PRO_COMPARE: readonly {
  what: string;
  kanto: string;
  template: string;
  pro: string;
}[] = [
  { what: 'Components, themes, accessibility', kanto: 'Yes', template: 'Yes', pro: 'Yes' },
  { what: 'Screens: sign-in, dashboard, settings', kanto: '—', template: 'Yes', pro: 'Yes' },
  { what: 'Real accounts and sessions', kanto: '—', template: 'Faked', pro: 'Yes' },
  { what: 'A database, migrations, a data contract', kanto: '—', template: 'Faked', pro: 'Yes' },
  { what: 'Payments, plans and limits', kanto: '—', template: '—', pro: 'Yes' },
  { what: 'Admin panel, audit, flags', kanto: '—', template: '—', pro: 'Yes' },
  { what: 'One-command setup, AGENTS.md', kanto: '—', template: '—', pro: 'Yes' },
  { what: 'Licence', kanto: 'MIT, free', template: 'MIT, free', pro: 'Paid once' },
];

/** What people ask before they buy, answered straight. */
export const PRO_QUESTIONS: readonly { heading: string; answer: string }[] = [
  {
    heading: 'What do I get, exactly?',
    answer:
      'Access to the private GitHub repository: a Nuxt app, typed end to end, its tests and its guides. Run npm run setup, answer a few questions, and it becomes your project — with only what you chose, and a fresh history.',
  },
  {
    heading: 'Is it mine to change?',
    answer:
      'Every line. It is a starting point, not a framework you depend on: no runtime of ours, no call home.',
  },
  {
    heading: 'Can I build several products, or one for a client?',
    answer:
      'Yes, as many of your own as you like, and a product for a client you hand over. What you may not do is resell or publish the starter itself.',
  },
  {
    heading: 'What about updates?',
    answer:
      'One payment gives you the repository for good, updates included. Your project is yours from the setup on: take an update when you want it.',
  },
  {
    heading: 'Where does it run?',
    answer:
      'Everything runs on a Node server or in Docker — Render, Fly.io, Railway, a VPS. Vercel and Netlify run it too, with a cron for the emails, but files sent in messages need a server until a storage adapter comes.',
  },
  {
    heading: 'Can I get a refund?',
    answer:
      'Payments go through Polar, which handles the receipt, the VAT and refunds, under its terms.',
  },
  {
    heading: 'Does my AI agent know where things go?',
    answer:
      'AGENTS.md tells Claude Code, Cursor or Codex the map, the rules and the checks; docs/your-product.md walks a person through the same, with a worked example.',
  },
];

/** The setup, as a terminal shows it. */
export const PRO_SETUP = `$ npm run setup
Your product's name (Northwind): Clipboard
Its public address (https://northwind.example): clipboard.app
…
Your product
  1. Start from a blank page — your product goes there
  2. Keep Northwind's invoicing as an example
Choose 1–2 (1): 1
…
The database
  1. SQLite — a file, Turso or D1
  2. Postgres — Neon, Supabase or your own
  3. MongoDB — Atlas or your own
Choose 1–3 (1): 2
…

Clipboard is set up.
Removed: server/db/mongo, server/adapters/payments/lemonsqueezy.ts, …
Fill in .env: DATABASE_URL, STRIPE_SECRET_KEY, GOOGLE_CLIENT_ID, …
A fresh history: one commit, "Start from Clipboard".`;

/** A resource, the shortest way to a product's records. */
export const PRO_RESOURCE = `export default defineResource({
  name: 'clips',
  label: { one: 'Clip', many: 'Clips' },
  fields: {
    title: field.text({ label: 'Title', required: true, search: true }),
    source: field.text({ label: 'Source', required: true }),
    seconds: field.number({ label: 'Length, in seconds', min: 0 }),
  },
  roles: { read: 'viewer', write: 'member', delete: 'admin' },
  limits: { free: 3, pro: 500, team: null },
  nav: true,
});`;

/** The SaaS's three parts: who uses each, where it lives, and the one the buyer writes. */
export const PRO_PARTS: readonly {
  title: string;
  who: string;
  path: string;
  file: string;
  body: string;
  yours: boolean;
  /** Who it opens the live demo as: its customer, or the SaaS's creator. */
  as: 'customer' | 'creator';
}[] = [
  {
    title: 'Your product',
    who: 'Your users',
    path: '/app',
    file: 'home',
    body: 'What your users pay for. Northwind’s invoicing in the demo; yours in your copy.',
    yours: true,
    as: 'customer',
  },
  {
    title: 'Account',
    who: 'Your users',
    path: '/account',
    file: 'billing',
    body: 'Their plan and payments, their team and its roles, their settings and API keys.',
    yours: false,
    as: 'customer',
  },
  {
    title: 'Admin',
    who: 'You and your staff',
    path: '/admin',
    file: 'admin',
    body: 'Revenue, sign-ups, workspaces, support, plans, the landing and its flags.',
    yours: false,
    as: 'creator',
  },
];
