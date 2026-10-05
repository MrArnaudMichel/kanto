/**
 * Signing in, faked: any email and password get in, and the session lives in
 * localStorage. Replace these functions with your auth provider's; the pages
 * only call them.
 */
export interface Session {
  readonly name: string;
  readonly email: string;
  /** False until a new account has seen its first steps. */
  readonly welcomed: boolean;
}

const KEY = 'kanto-saas-session';

/** The session for this page when storage is blocked — private browsing. */
let fallback: Session | null = null;

export function currentSession(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : fallback;
  } catch {
    return fallback;
  }
}

function save(session: Session | null): void {
  fallback = session;
  try {
    if (session) localStorage.setItem(KEY, JSON.stringify(session));
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the session lasts as long as the page.
  }
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** "ada.park@…" → "Ada.park": a name until the person gives theirs. */
function nameFrom(email: string): string {
  const local = email.split('@')[0] ?? email;
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export async function signIn(values: { email?: string; password?: string }): Promise<Session> {
  await wait(500);
  const email = values.email?.trim() ?? '';
  if (!email || !values.password) throw new Error('Enter your email and password.');
  const session: Session = { name: nameFrom(email), email, welcomed: true };
  save(session);
  return session;
}

export async function signUp(values: {
  name?: string;
  email?: string;
  password?: string;
}): Promise<Session> {
  await wait(600);
  const email = values.email?.trim() ?? '';
  if (!email || !values.password) throw new Error('Enter your email and a password.');
  const session: Session = { name: values.name?.trim() || nameFrom(email), email, welcomed: false };
  save(session);
  return session;
}

export function updateSession(profile: { name: string; email: string }): void {
  const session = currentSession();
  if (session) save({ ...session, name: profile.name, email: profile.email });
}

export function markWelcomed(): void {
  const session = currentSession();
  if (session) save({ ...session, welcomed: true });
}

export function signOut(): void {
  save(null);
}
