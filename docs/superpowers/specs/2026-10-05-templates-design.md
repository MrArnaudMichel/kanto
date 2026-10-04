# Forkable templates and `create-kanto` — design

Date: 2026-10-05. Status: awaiting review.

## Goal

Starting a product on Kanto should take one command and leave a real project:
routed, typed, building, and using the blocks the way they are meant to be
used. The old docs "templates" were single screens to copy; these are whole
projects to fork and keep.

Success:

- `npm create kanto@latest` asks three questions and leaves a project whose
  `npm install && npm run dev` works at once.
- Each project is also forkable without the tool:
  `npx degit MrArnaudMichel/kanto/templates/saas-react my-app`.
- No template can ship broken: each one is built and opened in a browser, in
  CI and before every publish, against the package npm would ship.

## Decisions already made

| Question                 | Answer                                                          |
| ------------------------ | --------------------------------------------------------------- |
| Where the templates live | `templates/` in this repository, plus `npm create kanto@latest` |
| Stacks                   | React, Vue and vanilla TypeScript                               |
| Templates                | SaaS, landing, blog                                             |
| Order                    | SaaS first, in all three stacks, with the tool and the CI       |

## 1. The projects

One folder per template and stack: `templates/<template>-<stack>/`, nine in
all. Each is a standalone Vite + TypeScript project:

- its own `package.json`, depending on `kanto-ds@^<current minor>`, with
  `dev`, `build`, `preview` and `typecheck` scripts;
- a README: what is in it, how to run it, where to change the brand (one
  `setAppearance` call), and links to the components it uses;
- no lockfile committed (a fork resolves its own), `.gitignore` included;
- the brand set in one place, `src/brand.ts`, with `setAppearance` (and
  `setAccent`), so a fork re-colours itself in one edit.

Not npm workspaces: the library's lockfile and install stay as they are, and a
template folder is exactly what a fork gets.

### SaaS

An invoicing app — the same world as the blocks' examples — inside
`kt-app-shell`:

| Route                  | Built from                                                            |
| ---------------------- | --------------------------------------------------------------------- |
| `/sign-in`, `/sign-up` | `kt-auth-form`                                                        |
| `/welcome`             | `kt-empty-page` (first run)                                           |
| `/`                    | dashboard: `kt-page-header`, `kt-stat`, `kt-chart`, `kt-table`        |
| `/customers`           | `kt-table` with filter and pagination, `kt-side-panel` for a customer |
| `/settings`            | `kt-settings-section` ×3, `kt-confirm-dialog` for the danger zone     |
| anything else          | `kt-error-page`                                                       |

Data comes from a `src/data/` module with an async API (`listCustomers()`,
…) that resolves fixtures after a short delay — the one file a fork replaces
with its backend. Signing in is faked the same way, in `src/auth.ts`.

Routing: `react-router` (React), `vue-router` (Vue), and a ~50-line hash
router in `src/router.ts` (vanilla).

### Landing

One page, all blocks: `kt-header`, `kt-hero`, `kt-logo-cloud`,
`kt-feature-grid`, `kt-testimonials`, `kt-pricing-table`, `kt-faq`,
`kt-cta`, `kt-newsletter`, `kt-footer`. The words and data in one
`src/content.ts`, so a fork rewrites one file. No dependency beyond Kanto
(and React or Vue).

### Blog

`/` lists posts with `kt-post-grid`; `/posts/:slug` renders one with
`kt-blog-post`; `kt-newsletter` closes both. Posts are Markdown files in
`posts/` with front matter (title, date, author, tags, excerpt, cover), read
at build time with Vite's `import.meta.glob` and rendered with `marked`.

## 2. `create-kanto`

A new package in `packages/create-kanto/`, published as `create-kanto`.

- Zero dependencies: Node's `readline` for the questions, `fs` for the copy.
- Interactive: project name, template (SaaS, landing, blog), stack (React,
  Vue, vanilla). Or flags: `npm create kanto@latest my-app -- --template
saas --stack react`, and `--yes` for the defaults.
- It copies the chosen folder, sets `name` in `package.json`, renames
  `_gitignore` to `.gitignore` (npm strips `.gitignore` from packages),
  refuses a non-empty target, and prints the next three commands.
- The templates are bundled into the package at pack time (`prepack` copies
  `templates/` in), not fetched from GitHub: it works offline, and a given
  `create-kanto` always makes the templates of the same release.

### Versioning and release

`create-kanto` carries the same version as `kanto-ds` and is published by the
same `npm run release`: the release script bumps both, and `publish.yml`
publishes both. Its templates depend on `kanto-ds@^<that minor>`.

**One manual step, once:** npm's trusted publishing can only be configured on
a package that exists, so the very first `create-kanto` is published by hand
(`npm publish` from `packages/create-kanto`), then linked to `publish.yml` on
npmjs.com. Every release after that is automatic.

## 3. Checks

- `scripts/check-templates.js`, run by `npm run check:templates`: packs
  `kanto-ds` as `check:consumer` does; for each template, installs it with that
  tarball, type-checks, builds, serves the build and opens it in Chromium —
  no console error, the `kt-*` elements defined, each key route rendering its
  main element (for SaaS: sign in, then the dashboard's table has rows).
- Unit tests for `create-kanto`: scaffold into a temporary folder with flags,
  check the files, the name, `.gitignore`, and the refusal on a non-empty
  folder.
- CI: a `templates` job beside `verify`, so the main job does not get slower.
  `publish.yml` runs `check:templates` before publishing.
- `npm run verify` stays as it is (fast enough to run before each commit);
  `check:templates` installs real dependencies and is run on its own, and in
  CI.

## 4. Docs

- A guide page, "Start a project": the command, the three templates with a
  screenshot each, what is inside, and `degit` for those who prefer it.
- The home page's agents and stack sections, the README and `AGENTS.md` point
  to it.
- CHANGELOG: `create-kanto` and the templates under Added.

## 5. Phases

Each phase ends verified, committed, and reviewable on its own.

1. **SaaS × React, Vue, vanilla, `create-kanto`, `check:templates`, CI job.**
   Proves the whole chain on the largest template.
2. **Landing × 3.**
3. **Blog × 3**, the guide page, then a release with the first manual publish
   of `create-kanto`.

## Out of scope

- A backend, real auth, or a database in any template.
- Next.js, Nuxt, SvelteKit or Angular variants (possible later; the tool's
  template list is data).
- Server-side rendering of the components.

## Risks

- **Nine projects to keep up.** Mitigated by `check:templates` failing on any
  drift, and by keeping each template's own code small — the blocks do the
  work.
- **Template installs in CI are slow and need the network.** Hence a job of
  its own, with npm's cache.
- **React and Vue typings for every element**: already shipped
  (`kanto-ds/react`, `kanto-ds/vue`); the templates are the first real
  consumers, so gaps found there are fixed in the library, not worked around.
