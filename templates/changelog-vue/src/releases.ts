/** The releases, read: by kind, by version, and what came before and after. */
import type { KtBadgeTone } from 'kanto-ds';

export type Kind = 'new' | 'improved' | 'fixed';

export interface Change {
  readonly kind: Kind;
  readonly text: string;
}

export interface Release {
  readonly version: string;
  /** `2026-10-06`. */
  readonly date: string;
  readonly title: string;
  readonly summary: string;
  readonly changes: readonly Change[];
}

export const KINDS: readonly { value: Kind | 'all'; label: string }[] = [
  { value: 'all', label: 'Everything' },
  { value: 'new', label: 'New' },
  { value: 'improved', label: 'Improved' },
  { value: 'fixed', label: 'Fixed' },
];

export const KIND_LABEL: Readonly<Record<Kind, string>> = {
  new: 'New',
  improved: 'Improved',
  fixed: 'Fixed',
};

/** A kind's colour: a way to tell them apart, the label says which. */
export const KIND_TONE: Readonly<Record<Kind, KtBadgeTone>> = {
  new: 'primary',
  improved: 'info',
  fixed: 'success',
};

/** Each release with only its changes of `kind`; a release with none of them is left out. */
export function filterReleases(releases: readonly Release[], kind: Kind | 'all'): Release[] {
  if (kind === 'all') return [...releases];
  return releases
    .map((release) => ({
      ...release,
      changes: release.changes.filter((change) => change.kind === kind),
    }))
    .filter((release) => release.changes.length > 0);
}

export const releaseByVersion = (
  releases: readonly Release[],
  version: string,
): Release | undefined => releases.find((release) => release.version === version);

/** The releases either side, newest first: `newer` came after this one. */
export function neighbours(
  releases: readonly Release[],
  version: string,
): { newer?: Release | undefined; older?: Release | undefined } {
  const at = releases.findIndex((release) => release.version === version);
  if (at === -1) return {};
  return { newer: releases[at - 1], older: releases[at + 1] };
}

export function countByKind(release: Release): Record<Kind, number> {
  const counts: Record<Kind, number> = { new: 0, improved: 0, fixed: 0 };
  for (const change of release.changes) counts[change.kind] += 1;
  return counts;
}

const day = new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: 'UTC' });

/** `2026-10-06` → "October 6, 2026". */
export const formatDate = (iso: string): string => day.format(new Date(`${iso}T00:00:00Z`));
