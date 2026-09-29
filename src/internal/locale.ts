/**
 * The locale an element formats and sorts in: its own `locale` when set, else
 * the page's `<html lang>`, else the browser's language.
 *
 * The page's language comes before the browser's because it is what the text
 * around the element is written in — a French page read on an English browser
 * should still file "Élodie" the French way.
 */
export function resolveLocale(own: string): string {
  return own || document.documentElement.lang || navigator.language || 'en';
}
