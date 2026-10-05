/**
 * The console's one door to its data. Every screen asks here, and nothing else
 * touches the fixtures: replace these functions with calls to your backend and
 * the screens do not change.
 */
import {
  CUSTOMERS,
  EVENTS,
  FILES,
  INTEGRATIONS,
  MEMBERS,
  MESSAGES,
  ORDERS,
  REVENUE_TOTAL,
  SESSIONS,
  STORAGE,
  TILES,
  type AuditEvent,
  type FileRow,
  type Integration,
  type Member,
  type Message,
  type Session,
  type Tile,
} from './fixtures';
import { revenueSeries, type Entity, type Grain } from './generate';

export type { Entity, Grain } from './generate';
export type {
  AuditEvent,
  EventKind,
  FileRow,
  Integration,
  Member,
  Message,
  Role,
  Session,
  Tile,
} from './fixtures';

export interface Overview {
  readonly tiles: readonly Tile[];
  readonly total: number;
  readonly labels: readonly string[];
  readonly revenue: readonly number[];
  readonly orders: readonly Entity[];
  readonly activity: readonly AuditEvent[];
  readonly integrations: readonly Integration[];
  readonly storage: typeof STORAGE;
}

/** The three the overview lists. */
const HOME_INTEGRATIONS = ['stripe', 'postgres', 'slack'];

/** A network's worth of waiting, so the loading states show. */
const latency = (ms = 300) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** What the server holds: deleting a customer here is deleting it for every later call. */
let customers: readonly Entity[] = CUSTOMERS;
let integrations: readonly Integration[] = INTEGRATIONS;
let members: readonly Member[] = MEMBERS;
let sessions: readonly Session[] = SESSIONS;

export async function getOverview(grain: Grain): Promise<Overview> {
  await latency();
  const { labels, values } = revenueSeries(grain, REVENUE_TOTAL);
  return {
    tiles: TILES,
    total: REVENUE_TOTAL,
    labels,
    revenue: values,
    orders: ORDERS,
    activity: EVENTS.slice(0, 3),
    integrations: integrations.filter((entry) => HOME_INTEGRATIONS.includes(entry.id)),
    storage: STORAGE,
  };
}

export async function listMail(): Promise<readonly Message[]> {
  await latency();
  return MESSAGES;
}

export async function listCustomers(): Promise<readonly Entity[]> {
  await latency();
  return customers;
}

export async function deleteCustomers(ids: readonly number[]): Promise<void> {
  await latency();
  customers = customers.filter((row) => !ids.includes(row.id));
}

export async function listFiles(): Promise<readonly FileRow[]> {
  await latency();
  return FILES;
}

export async function listEvents(): Promise<readonly AuditEvent[]> {
  await latency();
  return EVENTS;
}

export async function listIntegrations(): Promise<readonly Integration[]> {
  await latency();
  return integrations;
}

export async function setIntegration(id: string, connected: boolean): Promise<void> {
  await latency(150);
  integrations = integrations.map((entry) => (entry.id === id ? { ...entry, connected } : entry));
}

export async function listMembers(): Promise<readonly Member[]> {
  await latency();
  return members;
}

export async function removeMember(id: number): Promise<void> {
  await latency();
  members = members.filter((member) => member.id !== id);
}

export async function listSessions(): Promise<readonly Session[]> {
  await latency();
  return sessions;
}

export async function revokeSession(id: string): Promise<void> {
  await latency();
  sessions = sessions.filter((session) => session.id !== id);
}
