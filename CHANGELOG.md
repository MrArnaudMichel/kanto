# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [1.3.0] — 2026-09-25

### Added

**Every string the elements write can be translated.** The README promised that
every default string was a property. About twenty were not — validation
messages, "Previous" and "Next", the headers of the table every chart renders,
and accessible names like "Clear" and "Dismiss" that only a screen reader hears
— and could not be changed at all. They now all come from one registry:

```js
import { setStrings } from 'kanto-ds/strings';

setStrings({
  clear: 'Effacer',
  noData: 'Aucune donnée',
  pageOf: (page, total) => `Page ${page} sur ${total}`,
});
```

- Anything left out stays in English. `KtStrings` lists every key.
- Switching at runtime re-renders every element, validation messages included.
- Strings that carry a value are functions, so a translation owns the word
  order.
- Text properties — `emptyText`, `placeholder`, `confirmLabel`… — still win for
  the one element they are set on, an empty string included. Their default is
  now `undefined`, meaning "from the registry".
- `setStrings`, `resetStrings`, `getStrings` and `defaultStrings` are exported
  from `kanto-ds` and from `kanto-ds/strings`, which loads no element.

### Changed

- **No more flash of raw content.** Until its script loads, a `kt-*` tag is an
  unknown element whose slotted text shows unstyled, then jumps into place.
  `base.css` (part of `styles.css`) now keeps Kanto's tags hidden while they
  are `:not(:defined)`, with `visibility` so the layout holds.

## [1.2.0] — 2026-09-24

React 19 is now the first-class path: it renders the `kt-*` tags directly, so
it needs no wrapper and no extra package. The React 18 wrappers stay, and stop
costing everyone else a dependency.

### Changed

- **`@lit/react` is no longer installed with kanto-ds.** It is an optional peer
  dependency, needed only by the wrappers in `kanto-ds/react`. **On React 18,
  install it alongside:** `npm install @lit/react`. Without it, importing
  `kanto-ds/react` fails to resolve. Vue, Angular, Svelte and React 19 projects
  never install it.
- `react-dom` is no longer listed as an optional peer dependency: nothing in
  Kanto imports it.

### Added

- **`kanto-ds/react/jsx`**, JSX typings for React 19. Without it TypeScript
  rejects every `kt-*` tag; with it, each tag takes its own properties and a
  typed handler for each event it fires — `onkt-change={(e) => e.detail.value}`.
  Types only: importing it loads nothing.

### Fixed

- The docs said Kanto ships seventeen default icons; it ships 22.

## [1.1.0] — 2026-09-24

### Added

- **Editor support.** The package ships a Custom Elements Manifest
  (`kanto-ds/custom-elements.json`) describing every element's attributes,
  properties, events, slots and CSS parts, and the editor data generated from
  it: `web-types.json`, which JetBrains IDEs pick up on their own, and VS
  Code's HTML and CSS custom data. Plain HTML gets completion and hover docs;
  the README has the one-line VS Code setting.

- `popup` and `expanded` on `kt-button`, passed to its inner button as
  `aria-haspopup` and `aria-expanded`. `kt-dropdown` sets them on its trigger;
  set them yourself when a button opens something else.

- **A `-text` step for every brand and semantic colour** —
  `--color-primary-text`, `--color-success-text`, `--color-warning-text`,
  `--color-danger-text`, `--color-info-text` — for text and icons, and
  `--color-danger-solid` for a filled destructive button.

### Fixed

**Every text colour meets WCAG AA in both themes.** An axe audit of every
element, one case per tone and variant, found 21 places under 4.5:1 — the
light success badge sat at 1.58:1. All pass now.

- Text and icons use the new `-text` steps; fills keep `-base`, so tinted
  backgrounds and solid buttons look as they did.
- `--color-primary-base` is a shade darker (`#5f5dea`) so white text on a
  primary button clears 4.5:1, and `--color-primary-hover` darkens instead of
  lightening, for the same reason. The delete button moves to
  `--color-danger-solid`.
- `--color-text-400`, behind `--text-muted`, lifts from `#9191a1` to
  `#a9a9b5` in dark. Labels, eyebrows and placeholders that were set in
  `--color-text-500` use `--text-muted`.
- Avatar initials mix the person's hue with the body text, so all eight hues
  read on their tint.

**Every field is a form control, as 1.0.0 promised.** `kt-input-menu`,
`kt-drag-drop` and `kt-segmented-control` held a value but never reached the
form around them, so a submission silently left them out. They are now
form-associated, like the other fields: serialised into `FormData` under
`name`, validated with `required`, and reset by `form.reset()`.

- `kt-input-menu` submits the chosen option's `id`, never its label.
- `kt-drag-drop` submits every held file under its `name`, exactly as
  `<input type="file" multiple>` would, so a `multipart/form-data` post works
  with no extra code. Without a `name` it submits nothing, like the native
  input.
- `kt-segmented-control` submits its `value`.
- **A disabled `kt-segmented-control` ignores the keyboard.** It was dimmed and
  ignored the pointer, but its segments kept their tab stop, and the arrow keys
  still changed the value.

**Screen readers hear what the screen shows.** An axe audit of every element in
both themes, in a real browser, found these:

- **`kt-toggle` had no accessible name** when its label was slotted: the switch
  and the text beside it were not connected, so it was announced as an
  unnamed switch.
- **`kt-dropdown` announced its state nowhere.** `aria-expanded` sat on a
  wrapper that never takes focus, where it is not even allowed. It now goes on
  the trigger itself, and `aria-haspopup="menu"` only when the panel is a menu
  — a panel of free content is a plain disclosure. `kt-split-button`'s caret
  follows.
- **`kt-input`'s error message was never read.** `aria-errormessage` held the
  message text instead of an element id, so "Enter an email." was taken for
  three ids that do not exist. The message is now linked with
  `aria-describedby`, as it newly is on `kt-textarea`, which had no link at
  all.

### Changed

- `homepage` in `package.json` points to the documentation site,
  <https://kanto.arnaudmichel.fr>, instead of the README.

## [1.0.1] — 2026-09-15

### Added

- `kt-split-button`, a primary action with a menu of related ones hanging off a
  caret. A caret press never surfaces as a `click` on the host, so one `click`
  listener means the primary action and nothing else.
- `align` on `kt-dropdown`, lining the panel up with the trigger's right edge
  instead of its left. Defaults to the existing behaviour.

### Changed

**`kt-chart` covers every common chart type.** It drew line, area and bar; it
now also draws horizontal, stacked and mixed bar-and-line charts, scatter,
bubble, pie, doughnut, polar area and radar — one element, one `type`
attribute, one data model. Existing charts keep working unchanged.

- **A value axis on every chart**, with ticks on round steps, formatted by
  `format`. `min` and `max` pin it; `no-axis` hides it for small charts.
- **A tooltip on every type**, bars and slices included. It opens beside a mark
  when there is no room above it, never on top of it.
- **The legend is a set of toggles.** Pressing an item hides the series, or the
  slice, and rescales the chart; the other colours stay where they were.
  `kt-series-toggle` reports it and can be cancelled.
- **Keyboard access.** The plot is focusable; arrow keys, Home, End and Escape
  walk the points, and the tooltip announces each one.
- **`smooth` is a true monotone spline.** It was documented as one and drew a
  curve with flat tangents at every sample.
- New properties: `stacked`, `horizontal`, `min`, `max`, `no-axis`, `formatX`,
  `center-label`, `total-label`. `KtSeries` gains `points` and `type`;
  `KtPoint` and `KtMark` are exported. `kt-point-hover` adds `series` to its
  detail.

The rules that made the chart honest still hold, and now cover the new types:
one value axis, bars and areas from zero, bubbles and polar slices sized by
area, slices read from a single series, the eight categorical hues in fixed
order, and the data always rendered as a table.

### Fixed

- **Bar charts no longer fuse into a wall.** Bars filled their whole band with
  no gap between categories; groups now take 64% of it.
- **Category labels sit under their bars.** They were placed with a line
  chart's geometry, so the first hung off the left edge and the last was
  clipped.
- **Bars are square at the baseline** and rounded only at the tip, so they stand
  on the axis instead of floating above it.

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
