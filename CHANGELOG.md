# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.1] — 2026-09-15

### Added

- `kt-split-button`, a primary action with a menu of related ones hanging off a
  caret. A caret press never surfaces as a `click` on the host, so one `click`
  listener means the primary action and nothing else.
- `align` on `kt-dropdown`, lining the panel up with the trigger's right edge
  instead of its left. Defaults to the existing behaviour.

## [1.0.0] — 2026-09-12

First release of Kanto, a design system for data-dense product interfaces:
one implementation, built on standard custom elements, that runs wherever HTML
does.

### Added

**Token layer** — colours, typography, spacing, motion and z-index as CSS
custom properties. Dark is the default; light and `auto` remap the same names,
so no component carries theme-specific CSS. Responsive scales for mobile, tablet
and ultra-wide, plus a `prefers-reduced-motion` block that zeroes every
duration in the system at once.

**42 elements** across six groups, each in a folder of its own holding the
element, its tests and its documentation:

- **Core** — `kt-button`, `kt-card`, `kt-code`, `kt-icon`, `kt-avatar`,
  `kt-badge`, `kt-kbd`
- **Forms** — `kt-form`, `kt-input` (with phone mode), `kt-textarea`,
  `kt-label-input`, `kt-select`, `kt-input-menu`, `kt-toggle`, `kt-drag-drop`
- **Navigation** — `kt-header`, `kt-breadcrumb`, `kt-sub-menu-navigation`,
  `kt-page-header`, `kt-tabs`, `kt-segmented-control`, `kt-toggle-button`,
  `kt-toggle-button-group`
- **Feedback** — `kt-progress-bar`, `kt-skeleton`, `kt-tooltip`, `kt-toast`,
  `kt-toast-container`, the `toaster` singleton, `kt-alert`, `kt-empty-state`
- **Overlays** — `kt-dropdown`, `kt-side-panel`, `kt-confirm-dialog`,
  `kt-modal`, `kt-collapsible`
- **Data** — `kt-table`, `kt-pagination`, `kt-stat`, `kt-chart`, `kt-meter`,
  `kt-timeline` (with `kt-timeline-item`)

Some of these earn their separation. `kt-tabs` and `kt-segmented-control` look
alike and mean different things: a segmented control picks a _value_ and
belongs in a form or a toolbar, tabs switch which _region of the page_ you are
looking at. `kt-meter` and `kt-progress-bar` are the same trap: a progress bar
answers "how far along" and turns green at the end, a meter answers "how is it
divided" and is full from the moment it renders. `kt-form` is a `<fieldset>` rather than a `<form>`, because a
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

**Four full applications** under `#/app/…`, rendered without the documentation
chrome because an application shell wrapped in another application shell reads
as neither. Each has a documentation page that embeds it, running, rather than
a screenshot:

- **Console** — an eleven-screen operations product sharing one shell: a Home
  with a date range, a stat row and a linked chart; a two-pane Inbox; a
  Customers table with filters, a bulk bar, a detail panel and a confirm
  dialog; Files; an Activity log; Integrations; and Settings in five
  sub-sections, two of them three levels down. A `⌘K` palette, a storage meter
  and a notification bell sit in the chrome, and the whole sidebar — nesting
  included — is `<kt-sub-menu-navigation>` rather than markup written for the
  screen.
- **Landing page** — hero, chart, features, a monthly/annual pricing toggle,
  an FAQ and a sign-up band.
- **Assistant** — a thread list, a transcript with streaming replies, the tool
  calls that produced each answer, and a sources rail that follows the turn
  being read.
- **Portfolio** — filterable work, a case-study panel, a career timeline and a
  contact form.

They are the reason several elements above exist. A gallery proves a button
renders; only a whole screen shows what happens when forty of them share one.

### Conventions

Decisions that hold across the system, stated once because every element
depends on them:

- **Sizes are `small`/`medium`/`large` everywhere.** One scale for every
  element, rather than a short spelling for fields and a long one elsewhere.
- **Attribute values are lowercase and hyphenated** — `secondary-no-bg`, never
  `secondaryNoBg`. HTML authors attribute values in lowercase, so a camelCase
  spelling silently fails half the time.
- **Phone mode requires `type="tel"`.** Sniffing the placeholder, the name or
  the icon for `/tel|phone/` would turn a field named `telephone_verifie` into
  a country picker.
- **A phone field submits the full international number**, not bare national
  digits — posting `612345678` with no country throws away what the picker
  exists to capture.
- **`heading`, not `title`**, on `kt-toast`, `kt-side-panel` and
  `kt-drag-drop`. Every element already has a `title`, and shadowing it puts
  the text in a native tooltip.
- **Icons come from the `lucide` package**, through a registry, rather than a
  UMD `<script>` and a global.
- **Component CSS lives in `static styles`**, not in strings injected into
  `<head>` on first render.

### Fixed

- **Sortable table headers are buttons.** They were clickable `<th>`s with a
  tabindex and no key handler, so the table could not be sorted by keyboard.
- **The segmented control is a radio group.** It rendered N independent
  buttons: five options meant five tab stops and no arrow keys.
- **Clickable cards and badges are real controls** — `role="button"`, a tab
  stop, Enter and Space.
- **The side panel and confirm dialog are native `<dialog>`s.** As fixed
  divs, Tab walked straight out of the panel into the page behind it.
- **The confirm dialog focuses Cancel**, so a stray Enter cannot delete
  anything.
- **Error toasts interrupt** (`role="alert"`); they were polite statuses that
  could sit unread.
- **Progress bars clamp their value.** Dividing by an unguarded `max` rendered
  `width: NaN%`.
- **Category badges tint through `color-mix`** instead of concatenating `"33"`
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
