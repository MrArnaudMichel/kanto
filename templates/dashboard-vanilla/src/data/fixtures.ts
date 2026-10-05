/**
 * Everything the console shows that is not generated: the mail, the files, the
 * audit log, the integrations, the members. It goes when src/data/api.ts talks
 * to your backend.
 */
import { buildEntities, type Entity } from './generate';

export const PERSON = { name: 'Dana Whitfield', email: 'dana@northwind.example' };

export const WORKSPACE = { name: 'Northwind', tagline: 'Operations console', node: 'eu-west-1' };

// === Home ===

export interface Tile {
  readonly label: string;
  readonly value: string;
  readonly delta?: string;
  readonly trend?: 'up' | 'down';
  /** Down is the good news: fewer open tickets. */
  readonly inverted?: boolean;
  readonly icon: string;
  /** The icon chip's colour: a way to find a tile, not a status. */
  readonly tone: 'blue' | 'violet' | 'green' | 'amber';
}

export const REVENUE_TOTAL = 292342;

export const TILES: readonly Tile[] = [
  { label: 'Customers', value: '712', delta: '+4.6%', trend: 'up', icon: 'users', tone: 'blue' },
  {
    label: 'Conversions',
    value: '1,602',
    delta: '-8%',
    trend: 'down',
    icon: 'chart-pie',
    tone: 'violet',
  },
  {
    label: 'Revenue',
    value: '$292,342',
    delta: '-3%',
    trend: 'down',
    icon: 'dollar-sign',
    tone: 'green',
  },
  {
    label: 'Open tickets',
    value: '18',
    delta: '-11%',
    trend: 'down',
    inverted: true,
    icon: 'life-buoy',
    tone: 'amber',
  },
];

export const ORDERS: readonly Entity[] = buildEntities(5, 4242);

export const CUSTOMERS: readonly Entity[] = buildEntities(64, 5150);

export const STORAGE = {
  used: 25.8,
  total: 120,
  segments: [
    { label: 'Documents', value: 11.2 },
    { label: 'Exports', value: 7.4 },
    { label: 'Backups', value: 5.1 },
    { label: 'Other', value: 2.1 },
  ],
};

// === Inbox ===

export interface Message {
  readonly id: number;
  readonly from: string;
  readonly subject: string;
  readonly preview: string;
  readonly body: readonly string[];
  readonly time: string;
  readonly unread: boolean;
  readonly starred: boolean;
  readonly folder: 'inbox' | 'archive';
}

export const MESSAGES: readonly Message[] = [
  {
    id: 1,
    from: 'Emma Davis',
    subject: 'Refund for order #4599',
    preview: 'The customer says the second charge was never authorised…',
    body: [
      'The customer says the second charge was never authorised, and the timestamps back that up — both attempts land inside the same minute.',
      'I have refunded the duplicate and left the original. Nothing else to do unless they come back.',
    ],
    time: '06:24',
    unread: true,
    starred: false,
    folder: 'inbox',
  },
  {
    id: 2,
    from: 'Frank Nguyen',
    subject: 'Q3 numbers are in',
    preview: 'Revenue is down 3% but orders are up — average basket fell…',
    body: [
      'Revenue is down 3% while orders are up 2%, so the average basket fell rather than demand.',
      'Worth looking at the discount codes before we read anything else into it.',
    ],
    time: '05:41',
    unread: true,
    starred: true,
    folder: 'inbox',
  },
  {
    id: 3,
    from: 'Chloe Bertin',
    subject: 'Design review — console shell',
    preview: 'Two notes on the sidebar and one on the empty states…',
    body: [
      'Two notes on the sidebar: the collapsed width should keep the icons centred, and the workspace switcher wants a divider under it.',
      'The empty states read well. The one in the mailbox is the best of them.',
    ],
    time: 'Yesterday',
    unread: true,
    starred: false,
    folder: 'inbox',
  },
  {
    id: 4,
    from: 'Hana Okafor',
    subject: 'Storage quota',
    preview: 'We are at 88% and climbing about a point a week…',
    body: ['We are at 88% and climbing roughly a point a week. Two months of runway.'],
    time: 'Yesterday',
    unread: true,
    starred: false,
    folder: 'inbox',
  },
  {
    id: 5,
    from: 'Marco Rossi',
    subject: 'Welcome to Northwind',
    preview: 'Everything you need to get started with the console…',
    body: ['Everything you need to get started is in the guide. Shout if anything is unclear.'],
    time: 'Mon',
    unread: false,
    starred: false,
    folder: 'inbox',
  },
];

// === Files ===

export type FileKind = 'PDF' | 'Sheet' | 'Image' | 'Archive' | 'Doc';

export interface FileRow extends Record<string, unknown> {
  readonly name: string;
  readonly kind: FileKind;
  readonly size: string;
  readonly opened: string;
  readonly starred: boolean;
}

export const FILES: readonly FileRow[] = [
  { name: 'Q3 revenue review.pdf', kind: 'PDF', size: '598 KB', opened: '1 d ago', starred: true },
  { name: 'Renewals — Sep.xlsx', kind: 'Sheet', size: '1.2 MB', opened: '1 d ago', starred: true },
  { name: 'Onboarding deck.pdf', kind: 'PDF', size: '5.2 MB', opened: '2 d ago', starred: false },
  { name: 'brand-marks.zip', kind: 'Archive', size: '18.4 MB', opened: '3 d ago', starred: false },
  { name: 'warehouse-eu.png', kind: 'Image', size: '842 KB', opened: '4 d ago', starred: false },
  { name: 'Incident 2026-08-31.md', kind: 'Doc', size: '16 KB', opened: '1 w ago', starred: false },
  { name: 'Audit export.xlsx', kind: 'Sheet', size: '4.3 MB', opened: '2 w ago', starred: false },
];

export const FILE_STATS: readonly Tile[] = [
  { label: 'Storage used', value: '25.8 GB', icon: 'hard-drive', tone: 'blue' },
  {
    label: 'Files and folders',
    value: '1,286',
    delta: '+36',
    trend: 'up',
    icon: 'files',
    tone: 'violet',
  },
  { label: 'Shared with others', value: '24', icon: 'share-2', tone: 'green' },
  { label: 'In the bin', value: '3.1 GB', icon: 'trash-2', tone: 'amber' },
];

// === Activity ===

export type EventKind = 'billing' | 'access' | 'system' | 'data';
export type EventVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

export interface AuditEvent {
  readonly heading: string;
  readonly body: string;
  readonly time: string;
  readonly day: string;
  readonly icon: string;
  readonly variant: EventVariant;
  readonly kind: EventKind;
  readonly actor: string;
}

export const EVENTS: readonly AuditEvent[] = [
  {
    heading: 'Invoice #4820 settled',
    body: 'Meridian Freight paid $18,240 in full, two days early.',
    time: '18:41',
    day: 'Today',
    icon: 'check',
    variant: 'success',
    kind: 'billing',
    actor: 'Stripe',
  },
  {
    heading: 'Sync agent quiet',
    body: 'No word from the eu-west-1 agent since 07:12. Retrying every five minutes.',
    time: '16:04',
    day: 'Today',
    icon: 'triangle-alert',
    variant: 'warning',
    kind: 'system',
    actor: 'Monitor',
  },
  {
    heading: 'Three seats added',
    body: 'Applied at the next renewal. The workspace now holds 22 of 25 seats.',
    time: '11:26',
    day: 'Today',
    icon: 'user-plus',
    variant: 'info',
    kind: 'access',
    actor: 'Dana Whitfield',
  },
  {
    heading: 'Export finished',
    body: '48,210 rows written to audit-export-2026-09-10.xlsx.',
    time: '09:02',
    day: 'Today',
    icon: 'download',
    variant: 'neutral',
    kind: 'data',
    actor: 'Scheduler',
  },
  {
    heading: 'Failed sign-in blocked',
    body: 'Six attempts from an unrecognised address in 40 seconds. The account is unlocked.',
    time: '22:47',
    day: 'Yesterday',
    icon: 'shield-alert',
    variant: 'danger',
    kind: 'access',
    actor: 'Security',
  },
  {
    heading: 'Retention policy changed',
    body: 'Audit logs are now kept for 400 days, up from 90.',
    time: '15:12',
    day: 'Yesterday',
    icon: 'shield',
    variant: 'neutral',
    kind: 'system',
    actor: 'Dana Whitfield',
  },
  {
    heading: 'Plan upgraded to Scale',
    body: 'Billed annually. The change takes effect immediately.',
    time: '10:35',
    day: 'Yesterday',
    icon: 'trending-up',
    variant: 'primary',
    kind: 'billing',
    actor: 'Dana Whitfield',
  },
];

export const EVENT_FILTERS: readonly { value: EventKind | 'all'; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'billing', label: 'Billing' },
  { value: 'access', label: 'Access' },
  { value: 'system', label: 'System' },
  { value: 'data', label: 'Data' },
];

// === Integrations ===

export interface Integration {
  readonly id: string;
  readonly name: string;
  readonly note: string;
  readonly icon: string;
  readonly tone: Tile['tone'];
  readonly category: 'Billing' | 'Data' | 'Messaging' | 'Identity';
  readonly detail: string;
  readonly connected: boolean;
}

export const INTEGRATIONS: readonly Integration[] = [
  {
    id: 'stripe',
    name: 'Stripe',
    note: 'Billing and invoices',
    icon: 'credit-card',
    tone: 'violet',
    category: 'Billing',
    detail: 'Invoices, refunds and dunning are mirrored into the customer record.',
    connected: true,
  },
  {
    id: 'postgres',
    name: 'Postgres',
    note: 'Primary datastore',
    icon: 'database',
    tone: 'blue',
    category: 'Data',
    detail: 'Read replica in eu-west-1, refreshed every 30 seconds.',
    connected: true,
  },
  {
    id: 's3',
    name: 'Object storage',
    note: 'Exports and backups',
    icon: 'hard-drive',
    tone: 'green',
    category: 'Data',
    detail: 'Nightly exports, kept 90 days, encrypted with a workspace key.',
    connected: true,
  },
  {
    id: 'slack',
    name: 'Slack',
    note: 'Alerts to #ops',
    icon: 'message-circle',
    tone: 'amber',
    category: 'Messaging',
    detail: 'Warnings and failures only — successes would be noise.',
    connected: false,
  },
  {
    id: 'okta',
    name: 'Okta',
    note: 'Single sign-on',
    icon: 'key-round',
    tone: 'blue',
    category: 'Identity',
    detail: 'SAML with SCIM provisioning. Requires the Scale plan.',
    connected: false,
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    note: 'Anything else',
    icon: 'webhook',
    tone: 'violet',
    category: 'Data',
    detail: 'Signed POSTs on every state change, with a replay window of 24 hours.',
    connected: false,
  },
];

// === Settings ===

export type Role = 'Owner' | 'Admin' | 'Member' | 'Viewer';

export const ROLES: readonly Role[] = ['Owner', 'Admin', 'Member', 'Viewer'];

export interface Member extends Record<string, unknown> {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly role: Role;
  readonly seen: string;
}

export const MEMBERS: readonly Member[] = [
  { id: 1, name: 'Dana Whitfield', email: 'dana@northwind.example', role: 'Owner', seen: 'Online' },
  {
    id: 2,
    name: 'Frank Nguyen',
    email: 'frank@northwind.example',
    role: 'Admin',
    seen: '12 min ago',
  },
  {
    id: 3,
    name: 'Chloe Bertin',
    email: 'chloe@northwind.example',
    role: 'Member',
    seen: '1 h ago',
  },
  {
    id: 4,
    name: 'Hana Okafor',
    email: 'hana@northwind.example',
    role: 'Member',
    seen: 'Yesterday',
  },
  { id: 5, name: 'Marco Rossi', email: 'marco@northwind.example', role: 'Viewer', seen: 'Mon' },
  { id: 6, name: 'Emma Davis', email: 'emma@northwind.example', role: 'Viewer', seen: '2 w ago' },
];

export const ROLE_ICONS: Record<Role, string> = {
  Owner: 'crown',
  Admin: 'shield',
  Member: 'user',
  Viewer: 'eye',
};

/** What each role can do, in the order of ROLES. */
export const CAPABILITIES: readonly { capability: string; allowed: readonly boolean[] }[] = [
  { capability: 'Read customers', allowed: [true, true, true, true] },
  { capability: 'Edit customers', allowed: [true, true, true, false] },
  { capability: 'Export data', allowed: [true, true, false, false] },
  { capability: 'Manage members', allowed: [true, true, false, false] },
  { capability: 'Change billing', allowed: [true, false, false, false] },
  { capability: 'Delete the workspace', allowed: [true, false, false, false] },
];

export interface NotificationSetting {
  readonly key: string;
  readonly label: string;
  readonly hint: string;
  readonly on: boolean;
  /** Some are not yours to turn off. */
  readonly locked?: boolean;
}

export const NOTIFICATION_GROUPS: readonly {
  heading: string;
  description: string;
  items: readonly NotificationSetting[];
}[] = [
  {
    heading: 'Activity',
    description: 'What happens in the workspace.',
    items: [
      { key: 'mentions', label: 'Someone mentions me', hint: 'Always worth knowing.', on: true },
      { key: 'replies', label: 'Replies to my messages', hint: '', on: true },
      {
        key: 'digest',
        label: 'Weekly digest',
        hint: 'A summary every Monday morning.',
        on: false,
      },
    ],
  },
  {
    heading: 'Other',
    description: 'Everything else the workspace sends.',
    items: [
      {
        key: 'security',
        label: 'Security alerts',
        hint: 'Sign-ins from a new device. Cannot be turned off.',
        on: true,
        locked: true,
      },
      {
        key: 'marketing',
        label: 'Product news',
        hint: 'Occasional, and never more than monthly.',
        on: false,
      },
    ],
  },
];

export interface Session {
  readonly id: string;
  readonly device: string;
  readonly where: string;
  readonly current: boolean;
}

export const SESSIONS: readonly Session[] = [
  {
    id: 'fedora',
    device: 'Fedora · Firefox',
    where: 'Lyon, France · current session',
    current: true,
  },
  { id: 'macos', device: 'macOS · Safari', where: 'Paris, France · 2 days ago', current: false },
  { id: 'ios', device: 'iOS · Northwind app', where: 'Lyon, France · 5 days ago', current: false },
];

export const REGION_OPTIONS = [
  { id: 'eu', label: 'Europe (Frankfurt)' },
  { id: 'us', label: 'United States (Virginia)' },
  { id: 'ap', label: 'Asia Pacific (Singapore)' },
];
