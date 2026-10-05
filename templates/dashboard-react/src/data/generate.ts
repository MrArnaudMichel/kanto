/**
 * Made-up records, generated rather than typed out: a seeded sequence instead
 * of Math.random, so the console shows the same customers on every reload.
 * It goes when src/data/api.ts talks to your backend.
 */
export type Region = 'North East' | 'South West' | 'Midlands' | 'North West';
export type Plan = 'Starter' | 'Pro' | 'Enterprise';
export type Status = 'Active' | 'Pending' | 'Archived';

export interface Entity extends Record<string, unknown> {
  readonly id: number;
  readonly ref: string;
  readonly owner: string;
  readonly region: Region;
  readonly plan: Plan;
  readonly amount: number;
  readonly status: Status;
  readonly updated: string;
}

export const REGIONS: readonly Region[] = ['North East', 'South West', 'Midlands', 'North West'];
export const PLANS: readonly Plan[] = ['Starter', 'Pro', 'Enterprise'];
export const STATUSES: readonly Status[] = ['Active', 'Pending', 'Archived'];

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

/** A small deterministic generator: the same seed, the same numbers. */
export function seeded(seed: number): () => number {
  let value = seed;
  return () => {
    value = (value * 1103515245 + 12345) & 0x7fffffff;
    return value / 0x7fffffff;
  };
}

export function buildEntities(count: number, seed: number): Entity[] {
  const random = seeded(seed);
  return Array.from({ length: count }, (_, index) => {
    const day = 1 + Math.floor(random() * 28);
    const month = ['Jan', 'Feb', 'Mar'][Math.floor(random() * 3)]!;
    return {
      id: index + 1,
      ref: `EN-${4800 + index}`,
      owner: OWNERS[Math.floor(random() * OWNERS.length)]!,
      region: REGIONS[Math.floor(random() * REGIONS.length)]!,
      plan: PLANS[Math.floor(random() * PLANS.length)]!,
      amount: Math.round((random() * 9000 + 120) * 100) / 100,
      status: STATUSES[Math.floor(random() * STATUSES.length)]!,
      updated: `${day} ${month}`,
    };
  });
}

export type Grain = 'daily' | 'weekly' | 'monthly';

/** Points per grain, so switching it changes the resolution, not just the labels. */
const POINTS: Record<Grain, number> = { daily: 30, weekly: 12, monthly: 6 };

/** A revenue curve for the period, at the grain asked for, summing to `total`. */
export function revenueSeries(grain: Grain, total: number): { labels: string[]; values: number[] } {
  const count = POINTS[grain];
  const random = seeded(20260910);
  const raw = Array.from({ length: count }, (_, i) => {
    const wave = Math.sin(i / (count / 6)) * 22 + Math.sin(i / 2.4) * 9;
    return Math.round(58 + wave + random() * 14);
  });
  const labels = Array.from({ length: count }, (_, i) => {
    if (grain === 'monthly') return ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'][i] ?? '';
    if (grain === 'weekly') return `W${i + 1}`;
    const day = 12 + i;
    return day <= 31 ? `${day} Aug` : `${day - 31} Sep`;
  });
  // Dollar amounts, not an index: the chart's ticks land on round values of what it is given.
  const scale = total / raw.reduce((sum, n) => sum + n, 0);
  return { labels, values: raw.map((n) => Math.round(n * scale)) };
}
