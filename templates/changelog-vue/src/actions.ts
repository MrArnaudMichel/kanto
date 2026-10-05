/**
 * Signing up for the release emails, faked: any address gets in, except one
 * on the list already. Call your email provider here.
 */
export async function subscribe(email: string): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 600));
  if (email.endsWith('@example.com')) throw new Error('That address is on the list already.');
}
