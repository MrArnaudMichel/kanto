# Discoverable — design

## Why

A search engine sees one page of the site: every address is `#/…`, and what
follows `#` is not read. Nothing tells a crawler what pages there are, nor
what each is about. AI tools — Claude Code, Cursor, Codex — learn a library
from the web and from what they can query while they code; Kanto gives them
`llms.txt`, nothing to query.

## What changes

1. **Real addresses.** `/guide/installation`, `/components/kt-button`,
   `/pro`. An old `#/…` link lands on its new address (`history.replaceState`),
   the Polar return `#/pro/thanks?checkout_id=…` included. Links inside the
   site move without a reload; a heading is `#its-id` again.
2. **Pages a crawler reads.** The build renders every route in a headless
   browser and writes its HTML (`dist-demo/<section>/<slug>/index.html`), the
   app taking over on load. Each page has its own title, description,
   canonical address and Open Graph tags. `sitemap.xml` lists every page,
   `robots.txt` points at it, `404.html` is the app for an address the build
   did not write. `llms.txt` and `agents.md` link the real addresses.
3. **`kanto-mcp`.** An MCP server (stdio), `npx kanto-mcp`, in
   `packages/kanto-mcp`, published beside create-kanto at the library's
   version. Its tools: `list_components`, `get_component` (its guide and its
   API — properties, attributes, events, slots, parts, CSS properties — from
   the custom elements manifest), `search_docs`, `get_guide`,
   `get_install` (a framework's setup). Its data is built into the package
   from the repository at release.
4. **Found elsewhere.** `homepage`, `repository`, `bugs` in package.json;
   GitHub topics and the outreach texts (Show HN, Product Hunt, an article,
   awesome lists) written in `docs/launch/`, posted by a person.

## Proving it

Unit tests for the router (path, old hash, query), the sitemap and the meta
per route, the MCP tools on the real manifest; the prerender checked by
`check:demo` (every route's HTML has its heading and its own title); the
browser tests and the whole `verify`.
