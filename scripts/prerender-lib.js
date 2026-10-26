/**
 * The prerender's pure parts: a page's HTML from the site's own, where it is
 * written, the sitemap and robots.txt. scripts/prerender.js drives the browser.
 */

const escape = (text) =>
  text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Sets the content of the meta tag whose `attribute` is `value`, however it is wrapped. */
function setMeta(html, attribute, value, content) {
  const pattern = new RegExp(`(<meta\\s+${attribute}="${value}"\\s+content=")[^"]*(")`);
  return html.replace(pattern, (_, start, end) => `${start}${escape(content)}${end}`);
}

/**
 * The site's index.html with one page in it: its title, description and
 * address, and the app's HTML in `#app`, marked so the app replaces it.
 * `meta` is what the page set: `{ title, description, canonical, robots }`.
 */
export function pageHtml(template, meta, body) {
  let html = template.replace(/<title>[^<]*<\/title>/, `<title>${escape(meta.title)}</title>`);
  html = setMeta(html, 'name', 'description', meta.description);
  html = setMeta(html, 'property', 'og:title', meta.title);
  html = setMeta(html, 'property', 'og:description', meta.description);
  html = setMeta(html, 'property', 'og:url', meta.canonical);
  const head = [`<link rel="canonical" href="${escape(meta.canonical)}" />`];
  if (meta.robots) head.push(`<meta name="robots" content="${escape(meta.robots)}" />`);
  html = html.replace('</head>', `  ${head.join('\n    ')}\n  </head>`);
  return html.replace('<div id="app"></div>', `<div id="app" data-prerendered>${body}</div>`);
}

/**
 * Where a page is written: `x/index.html`, for the address `/x/`. GitHub
 * Pages answers `/x` with a redirect to `/x/` wherever a folder `x/` exists.
 */
export function filesOf(path) {
  const name = path.replace(/^\/+|\/+$/g, '');
  return [name ? `${name}/index.html` : 'index.html'];
}

export function sitemapOf(urls) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${escape(url)}</loc></url>`),
    '</urlset>',
    '',
  ].join('\n');
}

export function robotsOf(site) {
  return `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n`;
}

/**
 * What is wrong with the written pages, as check:demo reports it: a page not
 * written, without a heading, with another page's title or another address.
 * `pages` is `[{ url, html }]`, `html` undefined for a file that is missing.
 */
export function problemsOf(pages) {
  const problems = [];
  const titles = new Map();
  for (const { url, html } of pages) {
    if (html === undefined) {
      problems.push(`${url}: not written`);
      continue;
    }
    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1] ?? '';
    const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1];
    if (titles.has(title))
      problems.push(`${url}: the title "${title}" is also ${titles.get(title)}'s`);
    else titles.set(title, url);
    if (!/<h1[\s>]/.test(html)) problems.push(`${url}: no heading`);
    if (canonical !== url) problems.push(`${url}: its canonical address is ${canonical}`);
  }
  return problems;
}
