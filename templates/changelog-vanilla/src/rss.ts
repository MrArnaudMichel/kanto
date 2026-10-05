/**
 * The feed, built from the same releases as the page. `public/rss.xml` is
 * this, written out — a test keeps the two equal; rewrite the file with
 * `buildRss` whenever the releases change.
 */
import type { Release } from './releases';

const escape = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

/** `2026-10-06` → "Tue, 06 Oct 2026 00:00:00 GMT", the date RSS asks for. */
export const rfc822 = (iso: string): string => new Date(`${iso}T00:00:00Z`).toUTCString();

export function buildRss(
  releases: readonly Release[],
  site: { readonly name: string; readonly url: string },
): string {
  const items = releases.map((release) => {
    const link = `${site.url}#/releases/${release.version}`;
    const changes = release.changes.map((change) => `${change.kind}: ${change.text}`).join('\n');
    return [
      '    <item>',
      `      <title>${escape(`${release.version} — ${release.title}`)}</title>`,
      `      <link>${escape(link)}</link>`,
      `      <guid>${escape(link)}</guid>`,
      `      <pubDate>${rfc822(release.date)}</pubDate>`,
      `      <description>${escape(`${release.summary}\n\n${changes}`)}</description>`,
      '    </item>',
    ].join('\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '  <channel>',
    `    <title>${escape(`${site.name} changelog`)}</title>`,
    `    <link>${escape(site.url)}</link>`,
    `    <description>${escape(`What is new in ${site.name}.`)}</description>`,
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}
