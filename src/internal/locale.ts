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

const formatters = new Map<string, Intl.DateTimeFormat>();

/**
 * A date format for `locale` and `options`, made once and reused. Building an
 * `Intl.DateTimeFormat` is slow next to using one, and a calendar formats
 * every day it shows on every render — a hundred of them for two arrow keys.
 */
export function dateFormat(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = formatters.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options);
    formatters.set(key, format);
  }
  return format;
}
