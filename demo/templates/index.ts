/**
 * Templates: whole screens built from Kanto, to copy into a product.
 *
 * Each is one source — the markup with its own styles, and a short script for
 * what markup cannot hold: data set as properties, a button that does
 * something. The same text renders the live preview, fills the code panel, is
 * what Copy copies and what StackBlitz runs, so what is shown is what is
 * shipped.
 */
import { toaster } from 'kanto-ds';
import { dashboard } from './dashboard.js';
import { onboarding } from './onboarding.js';
import { pricing } from './pricing.js';
import { settings } from './settings.js';
import { signIn } from './sign-in.js';

export interface Template {
  readonly slug: string;
  readonly name: string;
  readonly description: string;
  /** The page's markup, with its own `<style>`. */
  readonly html: string;
  /** A module script. It may import `toaster` from kanto-ds, nothing else. */
  readonly script: string;
}

export const TEMPLATES: readonly Template[] = [signIn, dashboard, settings, onboarding, pricing];

/**
 * Runs a template's script on the page it was drawn into. The one import a
 * template may make — `toaster` from kanto-ds — is handed in rather than
 * resolved, so the text that runs here is the text that is copied.
 */
export function runTemplate(template: Template): void {
  const body = template.script.replace(/^import .*;$/gm, '');
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  const run = new Function('toaster', body) as (handed: typeof toaster) => void;
  run(toaster);
}
