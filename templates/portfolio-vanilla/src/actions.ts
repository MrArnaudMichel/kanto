/** What the page does: scroll to a section, send a message, hand out the CV. */
import { toaster } from 'kanto-ds';
import type { Message } from './work';

/** Scrolls to a section by its id, gently unless the reader asked for less motion. */
export function scrollToSection(id: string): void {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
}

/** Sending a message, faked. Call your form service or your own endpoint here. */
export async function sendMessage(values: Message): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 700));
  void values;
}

/** The CV: point this at your PDF. */
export function downloadCv(): void {
  toaster.info('Your CV goes here', {
    description: 'Point downloadCv() in src/actions.ts at your PDF.',
  });
}
