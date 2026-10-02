# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and the project adheres to [Semantic Versioning](https://semver.org/).

## [1.8.0] — 2026-10-02

### Added

**`kt-command-palette`** — the palette a product opens on Cmd+K.

- Give it `commands` — a label, and optionally a group, an icon, keywords, a
  shortcut to show, a disabled state — and it lists them under their groups,
  narrows them as you type and runs the one you pick with `kt-select`.
- The search takes every word typed, in any order, in the label, a keyword or
  the group, ignoring case and accents, and ranks a label that starts with it
  first. Ties keep the order you gave.
- Cmd+K or Ctrl+K opens and closes it from anywhere; `hotkey` changes the
  letter or turns it off.
- Built on the native `<dialog>`; the field is a combobox over a listbox, the
  focus goes in on opening and back where it was on closing.

With React wrappers, React 19 JSX and Vue typings.

**`kt-slider`** — a value picked by sliding: a volume, a threshold, a price
range.

- One thumb, or two with `range`; each is a native range input, so the
  keyboard and what a screen reader announces come from the platform.
- The value is text — `"40"`, or `"20/80"` for a range — kept within `min`
  and `max` and on `step`; two thumbs never cross.
- `show-value` shows it above the track, through `format` when given one;
  `kt-input` fires while sliding, `kt-change` once let go.
- A form control, with `form.reset()` and a disabled fieldset.

With React wrappers, React 19 JSX and Vue typings.

**`kt-steps`** — the steps of a flow and where the reader is in it.

- Steps before `current` are complete, `current` is ringed, the rest are to
  come; a step with `error` shows where to go back to.
- With `navigable`, completed steps are buttons back to them — never forward.
- Across, or down a rail with `orientation="vertical"`.
- An ordered list with `aria-current="step"`, each state said in words.

With React wrappers, React 19 JSX and Vue typings.

## [1.7.0] — 2026-10-02

### Added

- **A file for the CDN.** `dist/cdn/kanto.min.js` is every element in one
  minified module, Lit and the default icons included, about 85 kB gzipped.
  The package's `unpkg` and `jsdelivr` fields point at it, so a page with no
  build step needs one script tag:
  `<script type="module" src="https://cdn.jsdelivr.net/npm/kanto-ds@1"></script>`.
  The release checks load it with nothing left to resolve.
- **For AI assistants.** `llms.txt` at the docs site's root indexes Kanto for
  them — the rules that make code right the first time and every component's
  page — and each page now ships in the package as
  `dist/docs/<tag>.md`, where an assistant working in a project finds it.
- The docs site opens on a home page: a wall of seventeen live product
  screens built from Kanto, re-themed from one row; a playground that
  re-themes a real screen and hands over the code, or opens it as a running
  project on StackBlitz; and answers to the questions people ask before they
  adopt a design system.
- Every code block on the docs site is coloured, in colours that hold 4.5:1
  in both themes.

### Fixed

- In the dark theme, an alert's action button in the alert's own tone — the
  example on the `kt-alert` page — read below 4.5:1 once the alert sat on a
  card: 4.11:1 for info, 4.45:1 for danger. `--color-info-text` and
  `--color-danger-text` are a shade lighter, and the accessibility suite now
  audits alerts with an action, on the page and on a card.
- A closed floating panel near the right edge — a menu in a blurred header —
  no longer widens the page.

## [1.6.1] — 2026-10-02

### Fixed

- `import 'kanto-ds'` and `import 'kanto-ds/vue'` registered no element in a
  production build. The package told bundlers its entry points had no side
  effects, so Vite and webpack dropped them, and every element with them; a
  development server does not tree-shake, which is why it only showed once
  deployed. Both entries now declare their side effects, and every release
  builds a real application against the packed package before it ships.

### Changed

- The default icons gain the few a first screen reaches for — `plus`,
  `pencil`, `settings`, `download`, `upload`, `external-link`, `filter`,
  `ellipsis`, `refresh-cw` — so a button copied from the docs draws its icon
  without a registration step.

## [1.6.0] — 2026-10-02

### Added

**`kt-multi-select`** — several choices from a list, typed to narrow it.

- Each choice shows in the field as a removable chip. The field keeps to one
  line: the chips that do not fit collapse into a "+N", so it sits in a row of
  filters without changing its height, and grows back as the field widens.
- The list stays open while options are ticked and unticked; Enter toggles the
  active one, Backspace in an empty field removes the last chip, and
  `kt-filter` reports the query for server-side lists.
- A form control, submitted like `<select multiple>`: one entry per chosen id
  under `name`. `required`, `error`, `form.reset()` and a disabled fieldset.
- An ARIA combobox over an `aria-multiselectable` listbox; the field's
  description says how many are chosen, since the chips may not all show.
  `selectedCount` joins `KtStrings`.

With React wrappers, React 19 JSX and Vue typings.

**`kt-date-input`** — a date typed into its parts, day, month and year.

- The segments follow the reader's language — `25/09/2026` in London,
  `09/25/2026` in New York, `25.09.2026` in Berlin — and the focus moves on as
  each fills, so a date is eight keystrokes. The arrows step a segment, a day
  never past its month's end; a two-digit year is written out on leaving it.
- The value is ISO 8601 and `null` until complete; `kt-change` fires once per
  date. A day that does not exist, or one outside `min`/`max`, shows the
  field's error tooltip.
- `calendar` adds a button that opens a `<kt-calendar>` on the field's date.
- A form control with `required`, `error`, `form.reset()` and a disabled
  fieldset. Each segment is a spinbutton with the numeric keypad on a phone;
  their names and placeholders join `KtStrings`.

With React wrappers, React 19 JSX and Vue typings.

**`kt-time-input`** — a time of day typed into its parts, hours and minutes.

- The reader's clock — `14:30` in London, `02:30 PM` in New York, `14.30` in
  Copenhagen — or the one `hour-cycle` names; on a 12-hour clock `a` or `p`
  sets the period. The value is always the 24-hour `HH:MM` that
  `<input type="time">` uses.
- `seconds` adds a segment and puts seconds in the value; `step` sets how many
  minutes the arrows move by; a time outside `min`/`max` shows the field's
  error tooltip.
- The same keyboard, form behaviour and spinbutton segments as
  `kt-date-input`, from a base the two share.

With React wrappers, React 19 JSX and Vue typings.

**Accent colour.** The primary colour is now a choice: seven presets set with
`data-accent="blue"` on the page or a container, or any colour through
`setAccent('#e11d48')`. Contrast is solved for each colour in OKLCH — white on
a primary fill and the accent as text both hold 4.5:1 in both themes — and the
neutral surfaces take a trace of its hue. `accentPalette()` returns the values
without applying them. The docs site has a Customise menu in its top bar.

**Appearance.** Font, corners, density and text size join the accent as
settings: `data-font`, `data-radius`, `data-density` and `data-text-size` on
the page or a container, or `setAppearance({ … })` for all of them with the
theme and accent. Density and text size compose with the responsive scales;
the defaults render as before.

### Changed

- **`kt-calendar`'s title opens one panel of years and months**, instead of a
  month grid and a separate grid of twelve years paged twelve at a time. The
  years scroll beside the months of the one chosen, bounded by `min` and `max`;
  typing four digits jumps to a year, Page Up and Down move by ten. Reaching a
  birth year is two clicks, or the year typed and one click. The header reads
  "September 2026" as one control with the arrows grouped beside it, the days
  are 32px, and today is a dot under its number. `KtCalendarView` is now
  `'day' | 'month'`.
- **`kt-date-picker` takes a typed date**, read the way the reader writes it —
  `25/09/2026`, `9/25/2026`, `25 sept.`, ISO, the year optional — and a period
  as two dates around a dash. A date that does not read, or falls outside
  `min`/`max`, is flagged as `kt-input` flags an error, and reported as
  `badInput`. The field is a text field now, the calendar button leading it.
  Parts: `field`, `input`, `trigger` (the button), `panel`, `presets`,
  `calendar`.
- **With `range`, `kt-date-picker` offers ready-made periods** — today, the last
  7 and 30 days, this month and last, this year — beside two months; `presets`
  replaces them, `[]` hides them. A single date gets a Today button. On screens
  under 720px it shows one month, the periods above it.
- **Popovers stand out in the light theme.** Every list, menu and calendar that
  opens over the page — `kt-select`, `kt-input-menu`, `kt-multi-select`,
  `kt-dropdown`, `kt-date-picker`, `kt-input`'s country picker — sat on a grey a
  step darker than the page, where a hover or a period's band barely showed.
  They now sit on white with an edge and a soft shadow, through new tokens:
  `--surface-popover`, `--border-popover`, `--shadow-popover`,
  `--divider-popover`. The dark theme looks as it did. A period's band in the
  calendar is a clearer tint.
- `kt-calendar` gains `months="2"`.
- Floating panels are placed again when their size changes, and keep the width
  of their content wherever they are placed: a period picker no longer runs off
  the screen once its months have drawn.
- `kt-radio`'s dot is centred on whole pixels in every browser; it sat off
  centre in Firefox.

## [1.5.2] — 2026-09-30

### Added

- The documentation site flags components added in the last two months as
  "New" in its navigation, read from this changelog's Added entries. The package
  itself is unchanged from 1.5.1.

## [1.5.1] — 2026-09-30

1.5.0 was tagged but never reached npm: a browser test failed on CI and the
publish stopped before uploading. 1.5.1 is the first release on npm with
everything listed under 1.5.0.

### Fixed

- The development toolchain resolved `brace-expansion` 5.0.9, flagged for
  denial of service by crafted brace patterns (GHSA-q2hr-2g5m-vwhr,
  GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p). It is now 5.0.12. It only reached
  the repository through ESLint, so the published package was never exposed
  and its contents are unchanged.
- The browser test of `kt-segmented-control`'s labels counted the boxes of the
  whitespace around a label as lines, which read as a wrapped label on CI's
  fonts. It now counts the label's own text only.

## [1.5.0] — 2026-09-30

### Added

**`kt-date-picker`** — a day or a period, in a field that opens a calendar.

- The value is ISO 8601 text: `2026-09-25`, or `2026-09-01/2026-09-25` with
  `range`. The field shows it formatted for the reader through `Intl`.
- The WAI-ARIA date picker dialog pattern: one tab stop in the grid, arrows by
  day and week, Page Up/Down by month (with Shift, by year), Enter to choose,
  Escape to close with focus back on the field. A period takes two picks, in
  either order, and fires `kt-change` once.
- A form control: ISO value, nothing for an incomplete period, `required`,
  `error`, `form.reset()`. `min` and `max` days can be reached but not chosen.

**`kt-calendar`** — the calendar on its own, for when it is the interface.

- The title's month and year are buttons that open a grid of months or of
  twelve years, so a date decades away is three or four clicks.
- Month and weekday names, and the first day of the week, follow the locale:
  `locale`, else the page's `lang`, else the browser's.

**`kt-table` for data sorted and paged on a server.**

- `manual`: `data` is the page the server sent, shown as it is, and
  `total-rows` is what the pager counts from. Headers and the pager still fire
  `kt-sort-change` and `kt-page-change`; the application loads what they ask
  for. A new sort sends the table back to page 1 with a single event.
- While `loading`, a manual table keeps the page on screen, dimmed and
  `aria-busy`, so the pager keeps its place and its focus.
- `page` is a public property in both modes.
- `locale` sorts text in a given language; by default the page's `lang`, then
  the browser's.
- `virtual` renders only the rows in view, so thousands of rows scroll without
  paging, under a sticky header. Rows must share one height; `aria-rowcount`
  and `aria-rowindex` keep screen readers counting the whole table.

**`kt-input` phone numbers.**

- A number typed with the country's trunk prefix — `06 12 34 56 78` after +33 —
  puts the field in its error state and reports a `patternMismatch` to the form.
  `KtCountry` gains an optional `trunkPrefix`, and `KtStrings` a
  `phoneTrunkPrefix` message.
- About 95 countries ship by default, sorted by name, up from six. Search
  ignores accents and matches dial codes from their start.
- The error message, the password toggle and the clear button each show a
  tooltip. The error's also shows while the field has focus, for keyboard
  users, until Escape puts it away.

- A `--duration-slow` token (0.4s, zero under reduced motion).

### Changed

- **`kt-tooltip` draws its bubble in the top layer**, as a popover placed from
  the trigger. No ancestor's `overflow` clips it any more, and it takes no room
  in the page. `placement` is now a preference: the bubble takes the opposite
  side when that one has no room, and stays inside the screen. Scrolling or
  resizing hides it. Long text wraps at 260px instead of running past it. A new
  `open` property holds the bubble open, for a trigger that cannot take focus.
- `kt-input` groups a phone number the way its country's `format` does, so
  what is typed matches the placeholder — a German number reads `1234 567890`
  rather than in threes. The US placeholder is `201-555-0123`.
- `kt-table` sorts once per change of `data`, order or locale rather than on
  every render. Replace `data` with a new array; changing it in place is not
  seen. Its sort indicator is the Lucide `arrow-up` or `arrow-down` icon.
- **The panels of `kt-select`, `kt-input-menu`, `kt-date-picker`,
  `kt-dropdown` and `kt-input`'s country picker open in the top layer**, like
  `kt-tooltip`'s bubble. A container with `overflow: hidden` — a table cell, a
  side panel — no longer cuts them off. Each opens below its trigger, or above
  it when there is no room below, and follows the trigger as the page scrolls.
- `kt-select`, `kt-input-menu`, `kt-date-picker`, `kt-dropdown` and
  `kt-input`'s country panel listen on the document only while they are open.
- `kt-calendar` makes each date format once instead of on every render.

### Fixed

- `kt-input` in phone mode submitted the national digits alone (`612345678`)
  instead of the international number (`+33612345678`), and a restored page
  lost the country.
- A `<fieldset disabled>` disabled none of the form controls inside it. All ten
  now follow it, and re-enabling the fieldset leaves a control its author
  disabled as it was.
- `kt-input` showed the US phone format as the placeholder of any field without
  one, an email field included.
- The search box of `kt-input`'s country panel shrank while the list below it
  overflowed.
- A hidden `kt-tooltip` by the right edge of the page widened the document and
  scrolled it sideways.
- `kt-segmented-control` split a label over two lines of its fixed-height
  segment when its container shrank to fit.
- `kt-toast`, `kt-progress-bar`, `kt-table` and `kt-tooltip` used literal
  colours or durations: the toasts' tints did not follow the theme, and the row
  hover and tooltip fade ignored reduced motion.

## [1.4.0] — 2026-09-25

### Added

**`kt-checkbox`** — a choice that applies when the form is submitted.

- A real `<input type="checkbox">` sits invisibly over the drawn box, so Space,
  the click on the label, the indeterminate state and what a screen reader
  announces all come from the platform.
- `indeterminate` draws a dash for a "select all" over a partial selection;
  the first click clears it, as on a native checkbox.
- Three sizes, off the button heights like `kt-toggle`.
- A form control: its `value` under `name` when checked, nothing otherwise;
  `required`, `error` and `form.reset()`.

**`kt-radio-group`** with **`kt-radio`** options — one choice among a few, all
visible.

- Native radios cannot form a group across shadow roots, so this is the ARIA
  radio group pattern: one tab stop, landing on the chosen option; arrow keys
  move and select, wrapping and skipping disabled options; Space selects.
- The group owns the value and is the form control: `name`, `required`,
  `error`, `form.reset()`. `orientation="horizontal"` lays the options in a
  row.

Both ship with React 18 wrappers, React 19 JSX and Vue typings.

- `checkRequired` in `KtStrings`, the message of a required checkbox left
  unchecked. The `minus` icon joins the defaults, for the indeterminate state.

### Fixed

- Four strings still fell back to English behind `||` and `??`: the
  toggle-button group's "Options", the chart data table's "Chart data" caption
  and "Value" column, and `kt-form`'s "Form section". They are now `options`,
  `chartData`, `chartValue` and `formSection` in `KtStrings`.

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
