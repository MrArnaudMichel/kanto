/**
 * Everything the site says, in one place: the person, the work, the career,
 * the writing. Rewrite this file and the site is yours.
 */
import type { KtPost } from 'kanto-ds';

export interface CareerStep {
  readonly heading: string;
  readonly time: string;
  readonly icon: string;
  readonly variant: 'neutral' | 'primary' | 'success' | 'info';
  readonly body: string;
}

export interface Project {
  readonly slug: string;
  readonly name: string;
  readonly tagline: string;
  readonly year: string;
  readonly role: string;
  readonly tags: readonly string[];
  readonly summary: string;
  readonly outcomes: readonly {
    readonly label: string;
    readonly value: string;
    readonly delta?: string;
  }[];
  readonly phases: readonly CareerStep[];
  readonly url: string;
}

export const PERSON = {
  name: 'Rowan Ellis',
  initials: 'RE',
  role: 'Design engineer',
  available: 'Available from October',
  heading: 'I build the interfaces other people build on.',
  lead: 'Ten years of product engineering, most of it spent on the unglamorous middle layer — design systems, data-dense tools, and the screens that make the rest possible.',
};

export const NAV = [
  { label: 'Work', href: '#work' },
  { label: 'Career', href: '#career' },
  { label: 'Writing', href: '#writing' },
  { label: 'Contact', href: '#contact' },
];

export const NUMBERS = [
  { label: 'Years shipping', value: '10', icon: 'clock' },
  { label: 'Products in production', value: '7', icon: 'layout-dashboard' },
  { label: 'Components published', value: '40', icon: 'component' },
  { label: 'Teams onboarded', value: '12', icon: 'users' },
];

export const TAGS = ['All', 'Design systems', 'Product', 'Front end', 'Open source'] as const;

export const PROJECTS: readonly Project[] = [
  {
    slug: 'northwind-ds',
    name: 'Northwind Design System',
    tagline: 'One vocabulary for four product teams',
    year: '2026',
    role: 'Design and engineering',
    tags: ['Design systems', 'Front end'],
    summary:
      'Forty components on one token layer. The useful part turned out to be the rule that every decision resolves to a token, which is what made a light theme cost no component CSS at all.',
    outcomes: [
      { label: 'Components', value: '40' },
      { label: 'Themes for free', value: '2' },
      { label: 'CSS shipped', value: '31 kB', delta: '-42%' },
    ],
    phases: [
      {
        heading: 'Audited the existing screens',
        time: 'Jan 2026',
        icon: 'search',
        variant: 'neutral',
        body: 'Eleven shades of grey across four products, and three separate buttons.',
      },
      {
        heading: 'Wrote the tokens first',
        time: 'Feb 2026',
        icon: 'palette',
        variant: 'primary',
        body: 'No component was allowed a literal colour.',
      },
      {
        heading: 'Ported the products',
        time: 'Apr 2026',
        icon: 'git-branch',
        variant: 'info',
        body: 'One product at a time, behind a flag, deleting the old CSS as each screen landed.',
      },
      {
        heading: 'Published 1.0',
        time: 'Jun 2026',
        icon: 'rocket',
        variant: 'success',
        body: 'Documentation, tests and a playground in the same release.',
      },
    ],
    url: 'https://example.com/northwind-ds',
  },
  {
    slug: 'atlas',
    name: 'Atlas',
    tagline: 'Fleet telemetry for people who are not engineers',
    year: '2025',
    role: 'Lead front end',
    tags: ['Product', 'Front end'],
    summary:
      'A control room rebuilt around one question — what needs me right now. The old dashboard showed everything and was read by nobody; the new one shows four things and is read every morning.',
    outcomes: [
      { label: 'Time to first action', value: '9s', delta: '-71%' },
      { label: 'Daily operators', value: '1,240', delta: '+38%' },
      { label: 'Support tickets', value: '62/mo', delta: '-54%' },
    ],
    phases: [
      {
        heading: 'Watched twelve morning shifts',
        time: 'Mar 2025',
        icon: 'eye',
        variant: 'neutral',
        body: 'Everyone opened the same three views and ignored the other nineteen.',
      },
      {
        heading: 'Cut the dashboard to four tiles',
        time: 'May 2025',
        icon: 'layout-dashboard',
        variant: 'primary',
        body: 'Everything else moved behind a search.',
      },
      {
        heading: 'Shipped to the whole fleet',
        time: 'Sep 2025',
        icon: 'rocket',
        variant: 'success',
        body: 'Region by region, the old view one click away for a month. Nobody went back.',
      },
    ],
    url: 'https://example.com/atlas',
  },
  {
    slug: 'ledger',
    name: 'Ledger',
    tagline: 'Reconciliation that explains itself',
    year: '2024',
    role: 'Product engineering',
    tags: ['Product'],
    summary:
      'Finance software fails when two numbers disagree and the screen will not say why. This one shows the arithmetic — every figure opens into the rows that made it.',
    outcomes: [
      { label: 'Month-end close', value: '3 days', delta: '-5 days' },
      { label: 'Manual adjustments', value: '11%', delta: '-29pt' },
      { label: 'Accounts covered', value: '4,800' },
    ],
    phases: [
      {
        heading: 'Sat with the close team',
        time: 'Feb 2024',
        icon: 'users',
        variant: 'neutral',
        body: 'Two weeks of watching spreadsheets argue with the ledger.',
      },
      {
        heading: 'Made every number open up',
        time: 'Jun 2024',
        icon: 'search',
        variant: 'primary',
        body: 'A figure is a link to the rows behind it, all the way down.',
      },
      {
        heading: 'Closed a month in three days',
        time: 'Nov 2024',
        icon: 'rocket',
        variant: 'success',
        body: 'Down from eight, with the auditors reading the same screens.',
      },
    ],
    url: 'https://example.com/ledger',
  },
  {
    slug: 'fieldnote',
    name: 'Fieldnote',
    tagline: 'Notes that stay out of the way',
    year: '2023',
    role: 'Maintainer',
    tags: ['Open source', 'Front end'],
    summary:
      'A plain-text notebook with one feature too many removed every release. Small, fast, and still used by the people who starred it in its first week.',
    outcomes: [
      { label: 'Stars', value: '3,900' },
      { label: 'Contributors', value: '64' },
      { label: 'Bundle', value: '18 kB' },
    ],
    phases: [
      {
        heading: 'Wrote it for myself',
        time: 'Jan 2023',
        icon: 'file',
        variant: 'neutral',
        body: 'A weekend, a text area, and a rule about never adding a toolbar.',
      },
      {
        heading: 'Opened it up',
        time: 'Apr 2023',
        icon: 'git-branch',
        variant: 'primary',
        body: 'A contributing guide written before the first pull request arrived.',
      },
      {
        heading: 'Handed over the keys',
        time: 'Dec 2023',
        icon: 'users',
        variant: 'success',
        body: 'Two maintainers who now ship more often than I did.',
      },
    ],
    url: 'https://example.com/fieldnote',
  },
];

export const CAREER: readonly CareerStep[] = [
  {
    heading: 'Principal engineer · Northwind',
    time: '2024 — now',
    icon: 'component',
    variant: 'primary',
    body: 'Design systems and the tooling around them. Four product teams, one vocabulary.',
  },
  {
    heading: 'Lead front end · Atlas',
    time: '2021 — 2024',
    icon: 'layout-dashboard',
    variant: 'neutral',
    body: 'Grew the interface team from two to nine and rebuilt the control room.',
  },
  {
    heading: 'Product engineer · Ledger',
    time: '2019 — 2021',
    icon: 'wallet',
    variant: 'neutral',
    body: 'Reconciliation, reporting, and how finance teams actually work.',
  },
  {
    heading: 'Front end · agency work',
    time: '2016 — 2019',
    icon: 'briefcase',
    variant: 'neutral',
    body: 'Thirty-odd sites in three years. Where I learned to finish things.',
  },
];

export const POSTS: KtPost[] = [
  {
    title: 'A light theme should cost nothing',
    href: '#writing',
    excerpt: 'If a component knows a colour, you have already bought a second stylesheet.',
    date: '2026-07-14',
  },
  {
    title: 'Stop shipping the empty state last',
    href: '#writing',
    excerpt: 'The blank screen is the first one a new user sees and the last one anybody designs.',
    date: '2026-04-02',
  },
  {
    title: 'Four tiles, and the argument about the other nineteen',
    href: '#writing',
    excerpt: 'What it took to delete most of a dashboard, and what came back.',
    date: '2025-12-09',
  },
];

export const CONTACT = {
  heading: 'Tell me what you are building',
  lead: 'Two sentences is plenty to start with. I answer within two days.',
  sent: 'Thanks — your message is on its way. I will answer within two days.',
};

export const FOOTER = {
  tagline: 'Design engineer. Interfaces other people build on.',
  legal: '© 2026 Rowan Ellis. Made with Kanto.',
};
