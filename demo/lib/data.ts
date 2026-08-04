/**
 * Sample data for the example screens.
 *
 * Deterministic on purpose — a seeded sequence rather than Math.random — so the
 * pages look the same on every reload, screenshots stay comparable, and a
 * "refresh" can visibly change the numbers without the rest drifting.
 */

export interface Entity extends Record<string, unknown> {
  id: number;
  ref: string;
  name: string;
  owner: string;
  region: Region;
  plan: Plan;
  amount: number;
  status: Status;
  updated: string;
}

export type Region = 'North East' | 'South West' | 'Midlands' | 'North West';
export type Plan = 'Starter' | 'Pro' | 'Enterprise';
export type Status = 'Active' | 'Pending' | 'Archived';

export const REGIONS: Region[] = ['North East', 'South West', 'Midlands', 'North West'];
export const PLANS: Plan[] = ['Starter', 'Pro', 'Enterprise'];
export const STATUSES: Status[] = ['Active', 'Pending', 'Archived'];

export const STATUS_TONE: Record<Status, string> = {
  Active: 'var(--color-success-base)',
  Pending: 'var(--color-warning-base)',
  Archived: 'var(--text-muted)',
};

const OWNERS = [
  'A. Michel',
  'C. Bertin',
  'F. Nguyen',
  'H. Okafor',
  'J. Lindqvist',
  'M. Rossi',
  'P. Duarte',
  'S. Haddad',
];

/** Small deterministic PRNG, so the dataset is stable across reloads. */
function seeded(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) & 0x7fffffff;
    return value / 0x7fffffff;
  };
}

export function buildEntities(count = 87, seed = 20260731): Entity[] {
  const random = seeded(seed);

  return Array.from({ length: count }, (_, index) => {
    const day = 1 + Math.floor(random() * 28);
    const month = ['Jan', 'Feb', 'Mar'][Math.floor(random() * 3)]!;

    return {
      id: index + 1,
      ref: `EN-${4800 + index}`,
      name: `Entity ${4800 + index}`,
      owner: OWNERS[Math.floor(random() * OWNERS.length)]!,
      region: REGIONS[Math.floor(random() * REGIONS.length)]!,
      plan: PLANS[Math.floor(random() * PLANS.length)]!,
      amount: Math.round((random() * 9000 + 120) * 100) / 100,
      status: STATUSES[Math.floor(random() * STATUSES.length)]!,
      updated: `${day} ${month}`,
    };
  });
}

export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const currencyPrecise = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

/** Twelve months of revenue, keyed off the same seed. */
export function monthlyRevenue(seed = 7): number[] {
  const random = seeded(seed);
  return Array.from({ length: 12 }, (_, i) => Math.round(38 + i * 3 + random() * 34));
}

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
