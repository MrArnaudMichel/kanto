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

**`#internal`, never `kanto-ds`.** Shared plumbing is imported as
`#internal/kt-element`, a private subpath: it resolves to the sources here and
to the emitted declarations in a consumer's install, without ever becoming
part of the public API. Reaching for the same thing through `kanto-ds` pulls in
the barrel — every element, and a cycle back onto the file that started it.
Test helpers are `#test/fixture`. The public entry points are for the demo site
and the tests, not for the library's own modules.

**A test per behaviour, not per method.** The suite should read as a
description of what the component does. Tests that assert on internals age
badly; tests that assert on the rendered result and the events do not.

## Before opening a pull request

```bash
npm run format
npm run lint
npm run typecheck
npm test
npm run build
```

CI runs all of these, plus both builds and a resolver check on the exports map.

## Commit messages

Conventional commits, scoped by group:

```
feat(forms): add the kt-radio-group element
fix(data): sort cells without stringifying objects
docs(core): document kt-button
```

Say **why** in the body when the change is not obvious from the diff. The
message is the only place that reasoning survives.
