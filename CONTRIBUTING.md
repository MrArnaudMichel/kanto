# Contributing

```bash
npm install
npx playwright install chromium   # once, for the browser tests
npm run dev      # documentation site at http://localhost:5173
npm test
```

## Adding a component

A component is four files in `src/components/<group>/`:

| File               | Contents                                         |
| ------------------ | ------------------------------------------------ |
| `kt-thing.ts`      | The element: logic and `static styles`           |
| `kt-thing.test.ts` | Its tests                                        |
| `kt-thing.md`      | API, accessibility notes, and when not to use it |
| —                  | An export line in `src/index.ts`                 |

Start by copying the closest existing component. The conventions are easier to
absorb from one than to list here.

## What the review looks for

**Tokens, not values.** No literal colour, size or duration in a component. If
a token is missing, add it to `src/tokens/` — that is the change, not a
one-off value.

**Keyboard first.** Everything a pointer can do, a keyboard can do. Anything
that opens closes with Escape. Anything focusable shows a focus ring. If you
find yourself writing a focus trap, use `<dialog>` instead.

**Events, not callbacks.** Emit a `kt-`-prefixed CustomEvent through
`emit()` — composed, bubbling, cancelable. Make it cancelable when a host might
reasonably want to veto the change.

**Properties for data.** Anything that is not a string or a boolean is a
property with `{ attribute: false }`.

**Names the platform has not taken.** `title`, `ariaSort`, `label` on some
elements — check before adding a property, because shadowing an `HTMLElement`
member fails in ways that are hard to trace. `heading` is the convention where
`title` would have been natural.

**`#internal`, never `kanto-ds`.** Shared plumbing is imported as
`#internal/kt-element`, a private subpath: it resolves to the sources here and
to the emitted declarations in a consumer's install, without ever becoming
part of the public API. Reaching for the same thing through `kanto-ds` pulls in
the barrel — every element, and a cycle back onto the file that started it.
Test helpers are `#test/fixture`. The public entry points are for the demo site
and the tests, not for the library's own modules.

**Two test environments.** `*.test.ts` runs in happy-dom: fast, and right for
rendering, events and state. `*.browser.test.ts` runs in headless Chromium, for
what a simulated DOM cannot compute — layout, the top layer, hit testing, focus,
and the axe audit in `src/components/a11y.browser.test.ts`, which checks every
element in both themes. A new element gets a case there. `npm test` runs both;
`npx vitest --project unit` runs only the fast one.

Form controls are tested through `formFixture`, which fakes the
`ElementInternals` happy-dom does not implement and returns spies for
`setFormValue` and `setValidity`.

**A test per behaviour, not per method.** The suite should read as a
description of what the component does. Tests that assert on internals age
badly; tests that assert on the rendered result and the events do not.

## Before opening a pull request

```bash
npm run format   # rewrites; the rest only report
npm run verify   # format:check, lint, typecheck, test, both builds, check:exports
```

`verify` is the same chain CI runs and the same one a release refuses to skip,
so a green `verify` locally means a green pipeline.

## Commit messages

Conventional commits, scoped by group:

```
feat(forms): add the kt-radio-group element
fix(data): sort cells without stringifying objects
docs(core): document kt-button
```

Say **why** in the body when the change is not obvious from the diff. The
message is the only place that reasoning survives.

## Releasing

`CHANGELOG.md` is the source. The notes on the GitHub release are extracted
from it, never written twice — two copies of the same text are two chances to
disagree, and the one nobody re-reads is always the one that goes stale.

Add the section at the top of the changelog, with the version and the date you
want published:

```markdown
## [1.1.0] — 2026-09-12

### Added

- `kt-splitter`, a two-pane resizer.
```

Then:

```bash
npm run release:dry   # the checks, and the exact notes that would be published
npm run release       # the real thing
```

`release` refuses to do anything until it is happy: on `main`, clean tree, tag
free, in step with origin, `gh` authenticated, and the whole `verify` chain
green. Only then does it bump `package.json`, commit `chore(release): 1.1.0`,
tag `v1.1.0`, push, and create the GitHub release.

Publishing that release publishes the package to npm (the **Publish to npm**
workflow) and deploys the documentation site — both follow the releases, so what
a reader installs and reads is the system as it shipped. The **Documentation
site** workflow also runs by hand from the Actions tab, which rebuilds the
latest release, or any ref you pass it.

### Setting up npm, once

The workflow publishes without a token: npm trusts it directly. On npmjs.com,
**kanto-ds → Settings → Trusted Publisher → GitHub Actions**, with the owner
`MrArnaudMichel`, the repository `kanto` and the workflow `publish.yml`. The
package has to exist before it can be configured, which is why 1.0.0 was
published by hand.

### Setting up Pages, once

Two settings, both one-time:

1. **Settings → Pages → Source: GitHub Actions.** The workflow brings its own
   permissions and artifact, so nothing else is needed here.
2. **Settings → Environments → `github-pages` → Deployment branches and tags →
   Add rule**, with ref type **Tag** and the pattern `v*`.

The second one is not optional and is easy to miss. Turning on Pages creates a
`github-pages` environment that only lets the default branch deploy, and this
site deploys from the release tag — so without that rule the build succeeds,
the deploy is rejected, and the run fails with _Tag "v1.0.0" is not allowed to
deploy to github-pages due to environment protection rules_.

Two things follow from the repository being private. Pages from a private
repository needs a paid plan, and the release page cannot read the GitHub API
anonymously — it falls back to the changelog this repository ships, which is
why that fallback exists. Both resolve themselves the day the repository goes
public, with no change here.
