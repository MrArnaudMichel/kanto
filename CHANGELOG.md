# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-07-17

First release of Kanto as a framework-agnostic design system. It replaces the
Angular-only [`kanto-ng`](https://github.com/MrArnaudMichel/kanto-ng), and its
short-lived React port, with one implementation built on custom elements.

### Added

**Token layer** — colours, typography, spacing, motion and z-index as CSS
custom properties. Dark is canonical; light and `auto` remap the same names, so
no component carries theme-specific CSS. Responsive scales for mobile, tablet
and ultra-wide, plus a `prefers-reduced-motion` block that zeroes every
duration in the system at once.

**23 elements** across six groups:

- **Core** — `kt-button`, `kt-card`, `kt-chip`, `kt-icon`
- **Forms** — `kt-input` (with phone mode), `kt-textarea`, `kt-label-input`,
  `kt-select`, `kt-input-menu`, `kt-toggle`, `kt-drag-drop`
- **Navigation** — `kt-breadcrumb`, `kt-sub-menu-navigation`,
  `kt-segmented-control`, `kt-toggle-button` and its group
- **Feedback** — `kt-progress-bar`, `kt-skeleton`, `kt-tooltip`, `kt-toast`,
  `kt-toast-container`, and the `toaster` singleton
- **Overlays** — `kt-dropdown`, `kt-side-panel`, `kt-confirm-dialog`
- **Data** — `kt-table`, `kt-pagination`

**Form participation** — every field is a form-associated custom element:
serialised into `FormData`, reset by `form.reset()`, validated by
`checkValidity()`.

**Framework entry points** — `kanto-ds/react` for typed wrappers, `kanto-ds/vue` for
the compiler predicate and template typings. Angular and Svelte need neither.

**A documentation site** under `demo/`, built with the design system and no
framework.

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
- **Table sorting is locale-aware** — "Élan" files next to "Elan", and
  "Entité 2" precedes "Entité 10". Empty values sort last in both directions.
- **Combobox arrows walk the filtered list.** They indexed into the unfiltered
  array, so pressing Down after typing selected whatever sat at that index.
- **Modified clicks on links are left alone**, so ⌘-click on a breadcrumb opens
  a tab.
- **`aria-current` marks the active navigation item.** The highlight was
  purely visual.
- **`font-display: swap`** — the dashboard rendered invisible text for the
  whole webfont fetch.
