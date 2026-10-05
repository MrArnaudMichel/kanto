/** Everything the changelog says: the product, its releases, and the posts about them. */
import type { KtPost } from 'kanto-ds';
import type { Release } from './releases';

/** Where the changelog lives: the feed's links start here. */
export const SITE = { name: 'Northwind', url: 'https://northwind.example/changelog/' };

export const INTRO = {
  heading: 'What is new in Northwind',
  lead: 'Every release of the invoicing app, newest first: what is new, what got better, what we fixed.',
};

export const NEWSLETTER = {
  heading: 'Get the release notes',
  lead: 'One email a release. Nothing else.',
};

export const RELEASES: readonly Release[] = [
  {
    version: '2.4.0',
    date: '2026-10-06',
    title: 'Recurring invoices',
    summary: 'Bill the same customer every month without writing the invoice again.',
    changes: [
      {
        kind: 'new',
        text: 'Recurring invoices: monthly, quarterly or yearly, with an end date or none.',
      },
      { kind: 'new', text: 'Reminder emails three days before a recurring invoice goes out.' },
      { kind: 'improved', text: 'The customer page shows what is billed next, and when.' },
      {
        kind: 'fixed',
        text: 'An invoice dated the 31st no longer moves to the 1st in shorter months.',
      },
    ],
  },
  {
    version: '2.3.0',
    date: '2026-09-15',
    title: 'A faster dashboard',
    summary: 'The dashboard opens in half the time, and the chart says what it shows.',
    changes: [
      { kind: 'improved', text: 'The dashboard loads its figures in one request instead of six.' },
      { kind: 'improved', text: 'The revenue chart reads its values aloud to screen readers.' },
      { kind: 'fixed', text: 'Overdue totals counted invoices paid on their due date.' },
    ],
  },
  {
    version: '2.2.0',
    date: '2026-08-28',
    title: 'Teams',
    summary: 'Invite the people you work with, and choose what each of them can do.',
    changes: [
      { kind: 'new', text: 'Invite teammates by email; they join the workspace you choose.' },
      { kind: 'new', text: 'Roles: owners, admins, members and viewers.' },
      {
        kind: 'improved',
        text: 'The settings page groups what a workspace and a person each own.',
      },
    ],
  },
  {
    version: '2.1.1',
    date: '2026-08-12',
    title: 'Fixes',
    summary: 'Small things, put right.',
    changes: [
      {
        kind: 'fixed',
        text: 'Searching customers by email ignored capital letters only half the time.',
      },
      {
        kind: 'fixed',
        text: 'The export kept the column order of the last export, not the screen’s.',
      },
    ],
  },
  {
    version: '2.1.0',
    date: '2026-07-30',
    title: 'Exports',
    summary: 'Every list exports to a spreadsheet, as it is on screen.',
    changes: [
      { kind: 'new', text: 'Export customers and invoices to CSV or XLSX.' },
      { kind: 'improved', text: 'Filters and sorting carry into the export.' },
    ],
  },
];

export const POSTS: readonly KtPost[] = [
  {
    title: 'Why recurring invoices took a year',
    href: '#/releases/2.4.0',
    excerpt: 'Dates are hard: the 31st, leap years, and customers who change plans halfway.',
    date: '2026-10-06',
    tags: ['Product'],
  },
  {
    title: 'Six requests to one',
    href: '#/releases/2.3.0',
    excerpt: 'How the dashboard got twice as fast without a cache.',
    date: '2026-09-16',
    tags: ['Engineering'],
  },
  {
    title: 'Who can do what',
    href: '#/releases/2.2.0',
    excerpt: 'Four roles, and the ones we left out on purpose.',
    date: '2026-08-29',
    tags: ['Product'],
  },
];

export const FOOTER = {
  tagline: 'Invoicing for teams that would rather be doing the work.',
  legal: '© 2026 Northwind',
};
