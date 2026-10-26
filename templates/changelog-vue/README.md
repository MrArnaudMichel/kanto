# Northwind changelog — release notes on Kanto, in Vue

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
| The page                     | `src/App.vue`                                    |

Releases open at `#/releases/<version>`, so the build runs on any static host.
The feed writes itself: `vite-feed.ts` rewrites `public/rss.xml` from the
releases each time the app starts or builds — commit it with them. Set
`SITE.url` in `src/content.ts` to where the changelog lives: the feed's links
start there.

## Components used

`kt-header`, `kt-toggle-button-group`, `kt-timeline`, `kt-badge`,
`kt-newsletter`, `kt-post-grid`, `kt-button`, `kt-footer`, `kt-error-page`.
Each is documented at https://kanto.arnaudmichel.fr/components/.
