# Templates, Apps and `create-kanto` — design

Date: 2026-10-05, revised the same day. Status: awaiting review of the
revision.

## Goal

Starting a product on Kanto should take one command and leave a real project:
routed, typed, building, and using Kanto the way it is meant to be used. The
docs site shows those projects as **Templates**, and shows real products built
with Kanto as **Apps**.

Success:

- `npm create kanto@latest` asks three questions and leaves a project whose
  `npm install && npm run dev` works at once.
- Each project is also forkable without the tool:
  `npx degit MrArnaudMichel/kanto/templates/saas-react my-app`.
- The site's Templates section shows every template running, with the one
  command that makes it.
- No template can ship broken: each one is built and opened in a browser, in
  CI and before every publish, against the package npm would ship.

## Decisions

| Question                 | Answer                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------- |
| Where the templates live | `templates/<template>-<stack>/` in this repository, plus `npm create kanto@latest`                       |
| Stacks                   | React, Vue and vanilla TypeScript — every template in all three                                          |
| Templates                | SaaS (built), Landing, Portfolio, Chat, Dashboard, Editor, Changelog — more later                        |
| The current demo apps    | The starting point of their templates; each leaves the site once its template is live                    |
| Dashboard vs SaaS        | Dashboard is the current Console: an admin panel. SaaS is the product with sign-in                       |
| Editor                   | A document editor: documents on the side, a page to write, a toolbar, autosave                           |
| The site's Blocks page   | Removed: the blocks stay in Components, under Blocks                                                     |
| The site's Apps section  | A showcase of real products built with Kanto: the Kanto site first, and a call for more                  |
| Order                    | The templates that exist as demos first (Landing, Portfolio, Chat, Dashboard), then Editor and Changelog |

## 1. The projects

One folder per template and stack, each a standalone Vite + TypeScript
project:

- its own `package.json`, depending on `kanto-ds@^<current minor>`, with
  `dev`, `build`, `preview` and `typecheck` scripts;
- a README: what is in it, how to run it, where to change the brand (one
  `setAppearance` call), and the components it uses;
- no lockfile committed (a fork resolves its own), `.gitignore` included;
- the brand set in one place, `src/brand.ts`;
- what does not depend on the stack — data, rules, view helpers, content —
  in shared files, identical across the template's three stacks and tested
  once (`scripts/templates.test.ts`);
- hash routing (`#/customers`), so a build runs on any static host.

Not npm workspaces: the library's lockfile and install stay as they are, and a
template folder is exactly what a fork gets.

### The templates

| Template      | What it is                                                                                       | Starts from            | Built from (mainly)                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------ | ---------------------- | ------------------------------------------------------------------------------------------- |
| **SaaS**      | An invoicing product: sign in, first steps, dashboard, customers, settings — **built** (phase 1) | —                      | `kt-app-shell`, `kt-auth-form`, `kt-empty-page`, `kt-table`, `kt-settings-section`          |
| **Landing**   | A product's marketing page, every section a block; words and data in one `src/content.ts`        | `demo/apps/landing`    | `kt-hero`, `kt-feature-grid`, `kt-pricing-table`, `kt-faq`, `kt-cta`, `kt-footer`           |
| **Portfolio** | A person's work: projects, a case study, a career, a contact form                                | `demo/apps/portfolio`  | `kt-timeline`, `kt-side-panel`, `kt-form`                                                   |
| **Chat**      | An assistant: conversations on the side, messages, a prompt; the model behind one function       | `demo/apps/chat`       | `kt-chat-message`, `kt-prompt-input`, `kt-app-shell`                                        |
| **Dashboard** | An admin console: home, inbox, customers, files, activity, integrations, nested settings         | `demo/apps/console`    | `kt-app-shell`, `kt-sub-menu-navigation`, `kt-table`, `kt-chart`, `kt-tree`                 |
| **Editor**    | A document editor: documents on the side, a page with a toolbar, autosave, version history       | new                    | `kt-app-shell`, `kt-tree`, `kt-toast`, and a writing surface chosen when phase 4 is planned |
| **Changelog** | A product's public release notes: releases, filters by kind, a subscribe form, RSS               | the docs' Release page | `kt-timeline`, `kt-badge`, `kt-newsletter`, `kt-post-grid`                                  |

Each fakes its back end the way SaaS does: one `src/data/api.ts` with async
functions over fixtures, the one file a fork replaces. Chat's model is one
`reply()` function that streams a canned answer, documented as where to call
a real model.

More later (the tool's template list is data): Blog, Shop, Docs.

## 2. `create-kanto`

A package in `packages/create-kanto/`, published as `create-kanto` — built in
phase 1:

- zero dependencies; interactive, or `--template`, `--stack`, `--yes`;
- sets `name` in `package.json`, names `_gitignore` back to `.gitignore`,
  refuses a non-empty target, prints the next three commands;
- templates bundled at pack time; the same version as `kanto-ds`, bumped and
  published by the same `npm run release`.

Each new template is one entry in `lib/choices.js` and its three folders.

**One manual step, once:** npm's trusted publishing can only be configured on
a package that exists, so the very first `create-kanto` is published by hand,
then linked to `publish.yml` on npmjs.com.

## 3. The docs site

### Templates — `#/templates`

The section comes back in the top bar, as the gallery of templates:

- **The gallery** (`#/templates`): one card per template — a screenshot, what
  it is for, its stacks, and two ways in: **Live demo** and the command.
- **A template's page** (`#/templates/<id>`): screenshots of its main
  screens; what is inside (routes, the files to change); the command, with a
  tab per stack (`npm create kanto@latest my-app -- --template saas --stack
react`) and Copy; the `degit` line; the components it uses, each linking to
  its page.
- **Live demos:** the site's build also builds each template's vanilla stack — the lightest build, the
  site's own way of using Kanto, and Kanto without a framework —
  into `templates/<id>/` beside the docs, so **Live demo** opens the real
  template, signed in with any email. Built in the Pages workflow, which
  already has the network.
- **Screenshots:** made by a script from those builds (as the share image is),
  committed under `demo/public/templates/`.

### Apps — `#/apps`

A showcase of real products built with Kanto: a card each — screenshot, name,
one line, a link. It starts with the Kanto docs site itself, and a card
"Built something with Kanto? Show it" leading to a GitHub issue form. Each
card is data in one file.

The current demos (`#/app/console/…`, `landing`, `chat`, `portfolio`) stay
reachable at their URLs while their template is built; each is removed, and
its URL sent to the template's page, once its template is live. The home page
stage, which draws on the console's screens, keeps working throughout.

### Blocks

The `#/blocks` page and its top-bar entry go; `#/blocks` and `#/templates/…`
links from before keep landing somewhere useful (the Components page of the
first block, and the gallery). The home page's "Build a page from blocks"
section becomes "Start from a template", leading to the gallery.

## 4. Checks

- `npm run check:templates` (phase 1): packs `kanto-ds`, installs each
  template against the tarball, type-checks, builds, serves and walks it in
  Chromium — one walk per template kind in `scripts/template-smoke.js`, the
  same for every stack. A template kind without a walk fails the check.
- `scripts/templates.test.ts`: each folder is a project; each template's
  shared files identical across its stacks; their logic unit-tested.
- CI: the `templates` job; `publish.yml` checks the templates before
  publishing.

## 5. Phases

Each phase ends verified, committed and reviewable on its own.

1. **SaaS × 3, `create-kanto`, `check:templates`, CI.** Done, on
   `feat/templates`.
2. **The site:**
   - Blocks page out.
   - Templates gallery and template pages, with SaaS.
   - Live demos and screenshots in the site build.
   - Apps as a showcase.
   - The two SaaS defects seen in its screenshots: the sidebar's background
     stops under its links, and the search field shows no icon.
3. **Landing, Portfolio, Chat, Dashboard × 3**, each from its demo, each
   retiring its demo when it lands.
4. **Editor and Changelog × 3.**

Releases: `feat/templates` merges to `main` only with the 1.10.0 release —
the React SaaS template needs the React types fixed in that branch. The first
release that carries `create-kanto` includes its manual first publish.

## Out of scope

- A back end, real auth, a database or a real model in any template.
- Next.js, Nuxt, SvelteKit or Angular variants.
- Server-side rendering of the components.

## Risks

- **Twenty-one projects to keep up.** Mitigated by `check:templates` failing on
  any drift, shared files per template, and keeping each template's own code
  small — the components do the work.
- **Template installs in CI and in the Pages build are slow and need the
  network.** A CI job of its own; the Pages build builds one stack per
  template.
- **The demos and their templates diverging during phase 3.** Each template
  starts from its demo's current code, and the demo goes the day the template
  lands.
