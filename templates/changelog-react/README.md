# Northwind changelog — release notes on Kanto, in React

A product's public release notes to start from: every release, newest first,
filtered by kind; a page per release with the ones either side; a form to get
them by email; and an RSS feed. Built from
[Kanto](https://kanto.arnaudmichel.fr)'s components and blocks.

```bash
npm install
npm run dev
```

## Where things are

| To change                    | Edit                                             |
| ---------------------------- | ------------------------------------------------ |
| The releases, and the words  | `src/content.ts`                                 |
| The brand                    | `src/brand.ts` — one `setAppearance` call        |
| The email sign-up            | `src/actions.ts` — call your email provider here |
| The feed                     | `src/rss.ts`; `public/rss.xml` is what it builds |
| The filter, a release's page | `src/releases.ts`                                |
| The page                     | `src/App.tsx`                                    |

Releases open at `#/releases/<version>`, so the build runs on any static host.
After changing the releases, write the feed again: `public/rss.xml` must be
what `buildRss(RELEASES, SITE)` returns.

## Components used

`kt-header`, `kt-toggle-button-group`, `kt-timeline`, `kt-badge`,
`kt-newsletter`, `kt-post-grid`, `kt-button`, `kt-footer`, `kt-error-page`.
Each is documented at https://kanto.arnaudmichel.fr/#/components.
