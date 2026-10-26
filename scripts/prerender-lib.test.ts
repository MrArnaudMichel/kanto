import { describe, expect, it } from 'vitest';
import { filesOf, pageHtml, problemsOf, robotsOf, sitemapOf } from './prerender-lib.js';

const SITE = 'https://kanto.example';
const TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <title>Kanto — the site</title>
    <meta
      name="description"
      content="The site."
    />
    <meta property="og:title" content="Kanto — the site" />
    <meta
      property="og:description"
      content="The site."
    />
    <meta property="og:url" content="${SITE}/" />
    <script type="module" src="/assets/index.js"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
`;

describe('the prerender', () => {
  const page = pageHtml(
    TEMPLATE,
    {
      title: 'button — Kanto',
      description: 'A "button" & more.',
      canonical: `${SITE}/components/kt-button`,
      robots: '',
    },
    '<h1>kt-button</h1>',
  );

  it('writes the page into the app, marked for the app to take over', () => {
    expect(page).toContain('<div id="app" data-prerendered><h1>kt-button</h1></div>');
    expect(page).toContain('<script type="module" src="/assets/index.js"></script>');
  });

  it('gives the page its own title, description and address, escaped', () => {
    expect(page).toContain('<title>button — Kanto</title>');
    expect(page).toContain('name="description"\n      content="A &quot;button&quot; &amp; more."');
    expect(page).toContain('<meta property="og:title" content="button — Kanto" />');
    expect(page).toContain(`<meta property="og:url" content="${SITE}/components/kt-button" />`);
    expect(page).toContain(`<link rel="canonical" href="${SITE}/components/kt-button" />`);
    expect(page).not.toContain('Kanto — the site');
  });

  it('keeps a page the app asks to keep out of search engines out', () => {
    expect(
      pageHtml(
        TEMPLATE,
        { title: 't', description: 'd', canonical: `${SITE}/x`, robots: 'noindex' },
        '',
      ),
    ).toContain('<meta name="robots" content="noindex" />');
  });

  it("writes a page as its folder's index, the address GitHub Pages answers", () => {
    // Pages redirects /x to /x/ wherever a folder x/ exists: /x/ is the address.
    expect(filesOf('/')).toEqual(['index.html']);
    expect(filesOf('/components/kt-button/')).toEqual(['components/kt-button/index.html']);
  });

  it('lists every page for search engines, and points them at the list', () => {
    const map = sitemapOf([`${SITE}/`, `${SITE}/guide/installation`]);
    expect(map).toMatch(
      /^<\?xml version="1.0" encoding="UTF-8"\?>\n<urlset xmlns="http:\/\/www.sitemaps.org\/schemas\/sitemap\/0.9">/,
    );
    expect(map).toContain(`<url><loc>${SITE}/guide/installation</loc></url>`);
    expect(robotsOf(SITE)).toBe(`User-agent: *\nAllow: /\n\nSitemap: ${SITE}/sitemap.xml\n`);
  });

  it('finds a written page without its heading, its own title or its address', () => {
    const write = (title: string, url: string, body: string) =>
      pageHtml(TEMPLATE, { title, description: 'd', canonical: url, robots: '' }, body);
    const good = [
      { url: `${SITE}/a`, html: write('A — Kanto', `${SITE}/a`, '<main><h1>A</h1></main>') },
      { url: `${SITE}/b`, html: write('B — Kanto', `${SITE}/b`, '<main><h1 id="b">B</h1></main>') },
    ];
    expect(problemsOf(good)).toEqual([]);
    expect(
      problemsOf([
        ...good,
        { url: `${SITE}/c`, html: write('A — Kanto', `${SITE}/c`, '<main><h1>C</h1></main>') },
        { url: `${SITE}/d`, html: write('D — Kanto', `${SITE}/d`, '<main></main>') },
        { url: `${SITE}/e`, html: write('E — Kanto', `${SITE}/elsewhere`, '<h1>E</h1>') },
        { url: `${SITE}/f`, html: undefined },
      ]),
    ).toEqual([
      `${SITE}/c: the title "A — Kanto" is also ${SITE}/a's`,
      `${SITE}/d: no heading`,
      `${SITE}/e: its canonical address is ${SITE}/elsewhere`,
      `${SITE}/f: not written`,
    ]);
  });
});
