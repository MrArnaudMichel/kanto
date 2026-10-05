/** What the page does: scroll to a section, and sign up for the newsletter. */

/** Scrolls to a section by its id, gently unless the reader asked for less motion. */
export function scrollToSection(id: string): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}

/**
 * Signing up for the newsletter, faked: any address gets in, except one on the
 * list already. Call your email provider here.
 */
export async function subscribe(email: string): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 600));
  if (email.endsWith('@example.com')) throw new Error('That address is on the list already.');
}
