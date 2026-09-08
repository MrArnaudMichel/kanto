# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-08-05

First release of Kanto as a framework-agnostic design system. It replaces the
Angular-only [`kanto-ng`](https://github.com/MrArnaudMichel/kanto-ng), and its
short-lived React port, with one implementation built on custom elements.

### Added

**Token layer** — colours, typography, spacing, motion and z-index as CSS
custom properties. Dark is canonical; light and `auto` remap the same names, so
no component carries theme-specific CSS. Responsive scales for mobile, tablet
and ultra-wide, plus a `prefers-reduced-motion` block that zeroes every
duration in the system at once.

**41 elements** across six groups, each in a folder of its own holding the
element, its tests and its documentation:

- **Core** — `kt-button`, `kt-card`, `kt-chip`, `kt-code`, `kt-icon`,
  `kt-avatar`, `kt-badge`, `kt-kbd`
- **Forms** — `kt-form`, `kt-input` (with phone mode), `kt-textarea`,
  `kt-label-input`, `kt-select`, `kt-input-menu`, `kt-toggle`, `kt-drag-drop`
- **Navigation** — `kt-header`, `kt-breadcrumb`, `kt-sub-menu-navigation`,
  `kt-tabs`, `kt-segmented-control`, `kt-toggle-button`,
  `kt-toggle-button-group`
- **Feedback** — `kt-progress-bar`, `kt-skeleton`, `kt-tooltip`, `kt-toast`,
  `kt-toast-container`, the `toaster` singleton, `kt-alert`, `kt-empty-state`
- **Overlays** — `kt-dropdown`, `kt-side-panel`, `kt-confirm-dialog`,
  `kt-modal`, `kt-collapsible`
- **Data** — `kt-table`, `kt-pagination`, `kt-stat`, `kt-chart`, `kt-timeline`
  (with `kt-timeline-item`)

Some of these earn their separation. `kt-tabs` and `kt-segmented-control` look
alike and mean different things: a segmented control picks a _value_ and
belongs in a form or a toolbar, tabs switch which _region of the page_ you are
looking at. `kt-form` is a `<fieldset>` rather than a `<form>`, because a
form-associated control finds its form by walking its own tree and a `<form>`
inside a shadow root would own nothing slotted into it. `kt-code` owns the
chrome around a block and leaves highlighting to the caller.

**Form participation** — every field is a form-associated custom element:
serialised into `FormData`, reset by `form.reset()`, validated by
`checkValidity()`.

**Framework entry points** — `kanto-ds/react` for typed wrappers, `kanto-ds/vue` for
the compiler predicate and template typings. Angular and Svelte need neither.

**A documentation site** under `demo/`, built with the design system and no
framework: a filterable sidebar, a table of contents that follows the scroll,
and a page per component rendered from that component's own markdown, so the
docs cannot drift from the file beside the source. Every component has a live
preview rather than a screenshot.

**Three worked examples** — a dashboard, a create form and an entities screen —
that actually run. Filters narrow, selection raises a bulk action bar, deleting
asks first, panels open on a row, the form validates and prints the payload
`FormData` collected. Components that have to cooperate show more than
components standing next to each other.

**Four full applications** under `#/app/…`, rendered without the documentation
chrome because an application shell wrapped in another application shell reads
as neither:

- **Console** — a four-section admin product sharing one shell: a Home with a
  date range, a stat row and a linked chart; a two-pane Inbox with compose,
  star, archive and delete; a Customers table with filters, a bulk bar, a
  detail panel and a confirm dialog; and Settings in four sub-sections.
  A `⌘K` palette, a workspace switcher and a notification bell sit in the
  chrome.
- **Landing page** — hero, chart, features, a monthly/annual pricing toggle,
  an FAQ and a sign-up band.
- **Assistant** — a thread list and a transcript with streaming replies.
- **Portfolio** — a personal site: filterable work, a case-study panel, a
  career timeline and a contact form.

They are the reason several elements above exist. A gallery proves a button
renders; only a whole screen shows what happens when thirty of them share one.

### Changed from the React port

- **Sizes are `small`/`medium`/`large` everywhere.** Fields used `sm`/`md`/`lg`;
  the system now has one scale.
- **`secondaryNoBg` is `secondary-no-bg`.** Attribute values are authored
  lowercase in HTML, and the camelCase spelling silently failed half the time.
- **Phone mode requires `type="tel"`.** The old build sniffed the placeholder,
  the name and the icon for `/tel|phone/`, which turned a field named
  `telephone_verifie` into a country picker.
- **A phone field submits the full international number**, not bare national
  digits — posting `612345678` with no country threw away what the picker
  exists to capture.
- **`title` is `heading`** on `kt-toast`, `kt-side-panel` and `kt-drag-drop`.
  Every element already has a `title`, and shadowing it put the text in a
  native tooltip.
- **Icons come from the `lucide` package**, through a registry, instead of a
  UMD `<script>` and `window.lucide`.
- **Component CSS lives in `static styles`**, not in strings injected into
  `<head>` on first render.

### Fixed

- **Sortable table headers are buttons.** They were clickable `<th>`s with a
  tabindex and no key handler, so the table could not be sorted by keyboard.
- **The segmented control is a radio group.** It rendered N independent
  buttons: five options meant five tab stops and no arrow keys.
- **Clickable cards and chips are real controls** — `role="button"`, a tab
  stop, Enter and Space.
- **The side panel and confirm dialog are native `<dialog>`s.** As fixed
  divs, Tab walked straight out of the panel into the page behind it.
- **The confirm dialog focuses Cancel**, so a stray Enter cannot delete
  anything.
- **Error toasts interrupt** (`role="alert"`); they were polite statuses that
  could sit unread.
- **Progress bars clamp their value.** Dividing by an unguarded `max` rendered
  `width: NaN%`.
- **Category chips tint through `color-mix`** instead of concatenating `"33"`
  onto a hex string, which only ever worked for six-digit hex.
- **Table sorting is locale-aware** — "Ångström" files next to "Angstrom", and
  "Entity 2" precedes "Entity 10". Empty values sort last in both directions.
- **Combobox arrows walk the filtered list.** They indexed into the unfiltered
  array, so pressing Down after typing selected whatever sat at that index.
- **Modified clicks on links are left alone**, so ⌘-click on a breadcrumb opens
  a tab.
- **`aria-current` marks the active navigation item.** The highlight was
  purely visual.
- **`font-display: swap`** — the dashboard rendered invisible text for the
  whole webfont fetch.

### Copy

All copy is English — placeholders, empty and loading states, validation
messages and every generated `aria-label`. Each of those strings is a
property, so an application in another language overrides it at the call site
rather than forking a component.
