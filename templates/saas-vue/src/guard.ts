/**
 * Where a visit should go instead — the same rules for every stack, so the
 * router of each only asks.
 */
import { currentSession } from './auth';

export const PUBLIC_PATHS: readonly string[] = ['/sign-in', '/sign-up'];

/**
 * `path` is the route asked for; `known` says whether the app has it. An
 * unknown path is the 404 page, for everyone. Returns the path to go to, or
 * null to stay.
 */
export function redirectFor(path: string, known: boolean): string | null {
  if (!known) return null;
  const session = currentSession();
  if (PUBLIC_PATHS.includes(path)) return session ? '/' : null;
  if (!session) return '/sign-in';
  if (!session.welcomed && path === '/') return '/welcome';
  return null;
}
