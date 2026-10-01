/**
 * The one-time invitation beside Customise: a first visit to the docs is
 * told the site can wear its own colours. Shown once, never inside an app or
 * on a phone, where it would cover what the visitor came for.
 */
const KEY = 'kanto-docs-customise-seen';
/** For browsers that block storage: seen for the rest of this page load. */
let seenThisLoad = false;

export function shouldInvite({
  hash,
  width,
  seen,
}: {
  hash: string;
  width: number;
  seen: boolean;
}): boolean {
  return !seen && width >= 600 && !hash.startsWith('#/app/');
}

export function readInviteSeen(): boolean {
  if (seenThisLoad) return true;
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
}

export function markInviteSeen(): void {
  seenThisLoad = true;
  try {
    localStorage.setItem(KEY, '1');
  } catch {
    /* seen for this load, at least */
  }
}

/** Test plumbing: forgets the in-memory flag between tests. */
export function resetInviteForTests(): void {
  seenThisLoad = false;
}
