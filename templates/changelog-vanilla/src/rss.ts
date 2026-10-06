/**
 * The feed, built from the same releases as the page. `vite-feed.ts` writes
 * it to `public/rss.xml` whenever the app starts or builds.
 */
import { KIND_LABEL, type Release } from './releases';

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
    // Readers show this as HTML: escaped once for the HTML, then again as XML below.
    const changes = release.changes
      .map((change) => `<li>${escape(`${KIND_LABEL[change.kind]}: ${change.text}`)}</li>`)
      .join('');
    const description = `<p>${escape(release.summary)}</p><ul>${changes}</ul>`;
    return [
      '    <item>',
      `      <title>${escape(`${release.version} — ${release.title}`)}</title>`,
      `      <link>${escape(link)}</link>`,
      `      <guid>${escape(link)}</guid>`,
      `      <pubDate>${rfc822(release.date)}</pubDate>`,
      `      <description>${escape(description)}</description>`,
      '    </item>',
    ].join('\n');
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escape(`${site.name} changelog`)}</title>`,
    `    <link>${escape(site.url)}</link>`,
    `    <description>${escape(`What is new in ${site.name}.`)}</description>`,
    `    <atom:link href="${escape(`${site.url}rss.xml`)}" rel="self" type="application/rss+xml"/>`,
    ...(releases[0] ? [`    <lastBuildDate>${rfc822(releases[0].date)}</lastBuildDate>`] : []),
    ...items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}
