/**
 * What each screen shows of its data — filtered, sorted, paged — as plain
 * functions, so every stack shows the same thing and the tests check it once.
 */
import type { AuditEvent, Entity, EventKind, FileRow, Message } from './data/api';

// === Customers ===

export const PAGE_SIZE = 9;

export interface CustomerQuery {
  readonly query: string;
  readonly plan: string | null;
  readonly regions: readonly string[];
  readonly sortKey: string | null;
  readonly sortDirection: 'asc' | 'desc' | null;
  readonly page: number;
}

export const NO_FILTERS: CustomerQuery = {
  query: '',
  plan: null,
  regions: [],
  sortKey: 'ref',
  sortDirection: 'asc',
  page: 1,
};

export interface CustomerPage {
  readonly rows: readonly Entity[];
  /** How many match the filters, across every page. */
  readonly total: number;
  readonly totalPages: number;
  /** The page shown: the one asked for, or the last there is. */
  readonly page: number;
}

/** Filters, then sorts every match, then cuts the page — sorting never stops at the page's edge. */
export function customerPage(rows: readonly Entity[], query: CustomerQuery): CustomerPage {
  const needle = query.query.trim().toLowerCase();
  const matches = rows.filter((row) => {
    if (query.plan && row.plan !== query.plan) return false;
    if (query.regions.length > 0 && !query.regions.includes(row.region)) return false;
    if (!needle) return true;
    return `${row.ref} ${row.owner} ${row.region} ${row.plan}`.toLowerCase().includes(needle);
  });
  const { sortKey, sortDirection } = query;
  if (sortKey && sortDirection) {
    const sign = sortDirection === 'asc' ? 1 : -1;
    matches.sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      if (typeof left === 'number' && typeof right === 'number') return (left - right) * sign;
      return String(left).localeCompare(String(right), 'en', { numeric: true }) * sign;
    });
  }
  const totalPages = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, query.page), totalPages);
  return {
    rows: matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: matches.length,
    totalPages,
    page,
  };
}

/** How many filters narrow the list: what the "Clear" button counts. */
export const activeFilters = (query: CustomerQuery): number =>
  (query.plan ? 1 : 0) + query.regions.length;

// === Inbox ===

export type MailFilter = 'all' | 'unread' | 'starred';

export function visibleMail(
  messages: readonly Message[],
  filter: MailFilter,
  query: string,
): Message[] {
  const needle = query.trim().toLowerCase();
  return messages.filter((message) => {
    if (message.folder !== 'inbox') return false;
    if (filter === 'unread' && !message.unread) return false;
    if (filter === 'starred' && !message.starred) return false;
    if (!needle) return true;
    return `${message.from} ${message.subject} ${message.preview}`.toLowerCase().includes(needle);
  });
}

export const unreadCount = (messages: readonly Message[]): number =>
  messages.filter((message) => message.unread && message.folder === 'inbox').length;

// === Files ===

export type FileFilter = 'all' | 'starred';

export function visibleFiles(
  files: readonly FileRow[],
  filter: FileFilter,
  query: string,
): FileRow[] {
  const needle = query.trim().toLowerCase();
  return files.filter(
    (file) => (filter === 'all' || file.starred) && file.name.toLowerCase().includes(needle),
  );
}

// === Activity ===

/** The log, one group per day, in the order the days come. */
export function eventsByDay(
  events: readonly AuditEvent[],
  kind: EventKind | 'all',
): { day: string; events: AuditEvent[] }[] {
  const days: { day: string; events: AuditEvent[] }[] = [];
  for (const event of events) {
    if (kind !== 'all' && event.kind !== kind) continue;
    const group = days.find((candidate) => candidate.day === event.day);
    if (group) group.events.push(event);
    else days.push({ day: event.day, events: [event] });
  }
  return days;
}
