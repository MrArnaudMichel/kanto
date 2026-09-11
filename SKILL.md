---
name: kanto-design
description: Use this skill to build well-branded interfaces with Kanto, the design system by Arnaud Michel. Contains the design guidelines, colour and type tokens, fonts, and 23 framework-agnostic components for production code or throwaway prototypes.
user-invocable: true
---

# Kanto

A design system for data-dense product interfaces, shipped as
standard custom elements. Works in React, Vue, Angular, Svelte or plain HTML.

## Start here

1. Read `README.md` for the system's principles and the component index.
2. Read `src/tokens/README.md` before writing any CSS.
3. Read the `.md` file beside a component before using it — each documents its
   API, its accessibility contract, and when _not_ to reach for it.

## Building something

**Production code:** install the package, import `kanto/styles.css` once, and
use the elements. `docs/frameworks.md` has the per-framework setup.

**A prototype or a mock:** copy `src/tokens/` and `src/assets/fonts/` next to a
static HTML file, import `styles.css`, and load the elements from a bundle.
`demo/` is a working example built exactly this way — with no framework.

## The rules that matter most

- **Never hard-code a colour, size or duration.** Everything resolves to a
  token. That is what makes the light theme work with no per-component CSS.
- **Prefer the semantic aliases** — `--surface-card` over `--color-dark-16`,
  `--text-muted` over `--color-text-400`.
- **Data goes in as properties, not attributes.** `options`, `data`, `columns`.
- **Copy is English**, sentence case, no emoji. Keep it terse: "No data to
  display", not "There is currently no data available to display".
- **Every default string is a property.** Override `placeholder`, `emptyText`,
  `confirmLabel` and friends at the call site rather than forking a component.
- **Elevation is a lighter surface, not a shadow.**
- **One primary button per screen.** `delete` — the solid red — is for the
  irreversible only.

## If asked to design without further direction

Ask what they are building and who uses it, then act as the designer: propose a
layout, pick the components, and produce either static HTML or production code
depending on what they need.
