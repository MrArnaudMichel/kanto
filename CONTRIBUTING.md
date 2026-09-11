# Contributing

```bash
npm install
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

**`#internal`, never `kanto`.** Shared plumbing is imported as
`#internal/kt-element`, a private subpath: it resolves to the sources here and
to the emitted declarations in a consumer's install, without ever becoming
part of the public API. Reaching for the same thing through `kanto` pulls in
the barrel — every element, and a cycle back onto the file that started it.
Test helpers are `#test/fixture`. The public entry points are for the demo site
and the tests, not for the library's own modules.

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

Publishing that release deploys the documentation site — the site follows the
releases, so what a reader sees is the system as it shipped. The **Documentation
site** workflow also runs by hand from the Actions tab, which rebuilds the
latest release, or any ref you pass it.

### Setting up Pages, once

Settings → Pages → Source: **GitHub Actions**. Nothing else; the workflow
brings its own permissions and artifact.

Two things follow from the repository being private. Pages from a private
repository needs a paid plan, and the release page cannot read the GitHub API
anonymously — it falls back to the changelog this repository ships, which is
why that fallback exists. Both resolve themselves the day the repository goes
public, with no change here.
