# Kanto — instructions for AI agents

This project's interface is built with Kanto (`kanto-ds`): accessible web
components for dashboards, admin tools and forms. Build from them before
writing a control of your own.

## Before you write any interface

1. Find the component that does the job in the list below. A modal, a select,
   a date picker, a table, a toast: Kanto has it, accessible and themed.
2. Read its page before you use it — `node_modules/kanto-ds/dist/docs/<tag>.md`.
   Each page gives the properties, the events, what a screen reader hears and
   when not to use the component.
3. Style with the theme's tokens. Never write a colour, a size or a duration.

## Rules

- Install with `npm install kanto-ds`, then `import 'kanto-ds';` and
  `import 'kanto-ds/styles.css';` once at the root. Without a bundler, use
  `<script type="module" src="https://cdn.jsdelivr.net/npm/kanto-ds@1"></script>`
  and the stylesheet `https://cdn.jsdelivr.net/npm/kanto-ds@1/dist/styles.css`.
- Data goes in as properties, not attributes: `options`, `data`,
  `columns`, `items` — anything that is not a string or a boolean — are set
  from script (`table.data = rows`), or as `.data=${rows}` in Lit,
  `:data` in Vue, `[data]` in Angular, a plain prop in React 19.
- Events are `kt-`-prefixed CustomEvents with the payload in `detail`:
  `select.addEventListener('kt-change', (e) => e.detail.value)`.
- Style with tokens, never literal colours: `var(--surface-card)`,
  `var(--text-body)`, `var(--color-primary-base)`. Dark is the default
  theme; `<html data-theme="light">` or `"auto"` switches.
- Theme the whole system with attributes — `data-accent="teal"`,
  `data-font="inter"`, `data-radius="round"`, `data-density="compact"`,
  `data-text-size="large"` — or `setAppearance({ accent: '#e11d48' })`.
- Icons are Lucide names: `<kt-button icon="plus">`. Kanto ships the common
  ones; register others with `registerIcons({ Rocket })` from
  `kanto-ds/icons`.

## Mistakes agents make, and the fix

- **Data set as an attribute.** `<kt-select options="...">` does nothing:
  `options`, `data`, `columns` and `items` are properties.
- **Listening for `change` or `onChange`.** Kanto fires `kt-change`,
  `kt-input` and the like; the value is in `event.detail`.
- **Restyling with a wrapper and literal colours.** Use the tokens, the
  appearance attributes on `<html>`, or the `::part()` a page lists.
- **An icon that draws nothing.** Only the common Lucide icons are registered;
  register any other with `registerIcons` before using its name.
- **A hand-built control.** Before writing a dropdown, a dialog or a stepper,
  check the list: `kt-dropdown`, `kt-modal`, `kt-steps`.

## Components

### Core

- `kt-avatar` — A person or an organisation, as a picture or as their initials.
- `kt-avatar-group` — The people on something — a project's members, a document's editors — as avatars overlapping in a row, the rest summed up as "+N".
- `kt-badge` — A compact label: a pill `tag`, a monospaced `code` token, a `category` tinted with a colour of your choosing, or a `count`.
- `kt-button` — The Kanto action button.
- `kt-card` — The system's content surface: 12px radius, a 1px `--border-subtle` border, 24px of padding, 20px between its rows.
- `kt-code` — A block of code on a recessed surface, with its language and a copy button.
- `kt-copy-button` — Copies a value to the clipboard and says it did: an API key, an install command, a share link.
- `kt-icon` — A [Lucide](https://lucide.dev)
- `kt-kbd` — A keyboard shortcut, rendered per platform.
- `kt-split-button` — One button carrying a menu of related actions.

### Forms

- `kt-calendar` — A month calendar to pick a day or a period from, shown in the page.
- `kt-checkbox` — A checkbox: a choice that applies when the form is submitted.
- `kt-color-picker` — A colour, chosen from swatches or set freely: a label's colour, a theme's accent, a chart series.
- `kt-date-input` — A date typed into its parts — day, month and year, each its own segment.
- `kt-date-picker` — A date field with a calendar, for one day or a period.
- `kt-drag-drop` — A file drop zone.
- `kt-form` — A panel grouping related fields.
- `kt-input` — A single-line text field.
- `kt-input-menu` — A combobox: type to narrow the list, then pick.
- `kt-label-input` — A label above a form control, with a red asterisk when it is required.
- `kt-multi-select` — Several choices from a list: type to narrow it, pick as many as you need.
- `kt-number-input` — A number field with − and + beside it: a quantity, a seat count, an amount.
- `kt-otp-input` — A one-time code — the six digits of a sign-in, a verification, a second factor — one box per character.
- `kt-prompt-input` — The field a person writes to an assistant in: it grows with what is written, sends on Enter, and shows the sending on its own send button.
- `kt-radio-group` — One choice among a few, all visible at once.
- `kt-select` — A single-choice dropdown.
- `kt-slider` — A value picked by sliding along a range: a volume, a threshold, or with `range`, a price between two ends.
- `kt-textarea` — A multi-line field, with the same borderless fill and outline states as `<kt-input>`.
- `kt-time-input` — A time of day typed into its parts — hours, minutes and, if asked, seconds.
- `kt-toggle` — An on/off switch.

### Navigation

- `kt-app-shell` — The frame of an application: a header along the top, a sidebar down the side, and the content, which scrolls on its own.
- `kt-breadcrumb` — A trail showing where the current page sits.
- `kt-footer` — The site footer: a contentinfo landmark holding the brand and a word about the product, columns of links, actions, and a legal line under them.
- `kt-header` — The application header: a banner landmark holding the brand, the primary navigation and a row of actions.
- `kt-page-header` — The block every screen opens with: an overline, a title, a sentence, and the actions that belong to the page rather than to anything on it.
- `kt-segmented-control` — A small set of mutually exclusive choices, drawn as one inset track with the selected segment raised out of it.
- `kt-steps` — The steps of a flow — sign-up, checkout, onboarding — and where the reader is in it.
- `kt-sub-menu-navigation` — The sidebar: uppercase overline section titles over lists of links, to any depth.
- `kt-tabs` — An underlined tab bar.
- `kt-toggle-button` — A button that stays pressed.
- `kt-toggle-button-group` — Joins `<kt-toggle-button>`s into one bar and owns their selection.
- `kt-user-menu` — The account menu at the end of an application's header: the person's avatar, and under it who is signed in and what they can do.

### Feedback

- `kt-alert` — A message that stays on the page.
- `kt-empty-state` — What a screen shows when it has nothing to show.
- `kt-progress-bar` — A determinate progress bar.
- `kt-skeleton` — A loading placeholder, pulsing between `--surface-raised` and `--surface-hover` — the same elevation ramp everything else in Kanto uses, so it reads as part of the page rather than as a grey rectangle pasted onto it.
- `kt-toast` — A transient notification.
- `kt-toast-container` — The stack that owns the toasts on screen, and the imperative shortcut to it.
- `kt-tooltip` — A short label that appears on hover or focus.

### Overlays

- `kt-accordion` — A set of `kt-collapsible` sections that open one at a time: opening one folds the one that was open, so the page stays the length of one answer.
- `kt-collapsible` — A section that folds away.
- `kt-command-palette` — The palette a product opens on Cmd+K: every action and page, a few keystrokes away.
- `kt-confirm-dialog` — A centred yes/no overlay for an action worth stopping to think about.
- `kt-dropdown` — A panel anchored to a trigger.
- `kt-modal` — A centred dialog for anything that is not a yes/no question.
- `kt-side-panel` — A drawer sliding in from the right, for viewing or editing one record without losing the list behind it.
- `kt-tour` — A guided tour: a few steps, each pointing at a part of the page with a word about it — a product's first run, a new feature.

### Data

- `kt-chart` — A chart, drawn from the token layer: line, area and bar — stacked, sideways or mixed — plus scatter, bubble, pie, doughnut, polar area and radar.
- `kt-chat-message` — One message of a conversation with an assistant.
- `kt-description-list` — Terms and their details — an invoice's number, customer and amount; a person's email and role — the body of a detail page.
- `kt-meter` — How a fixed total is spent: storage by file type, a budget by category, seats by role.
- `kt-pagination` — Previous / next paging, with the position between them.
- `kt-stat` — One headline figure: a label, a value, and how it moved.
- `kt-table` — A data table: tri-state sorting, single or multiple selection, paging.
- `kt-timeline` — An ordered run of events on a rail.
- `kt-tree` — Things inside things — folders and files, an organisation's teams, nested pages — as a tree to open and walk.

### Blocks

- `kt-auth-form` — The way into a product: signing in, creating an account, resetting a password, entering a code — one block, four modes.
- `kt-cta` — The ask at the end of a page: a heading, a line, and the button that acts on them.
- `kt-error-page` — The page a person lands on when the one they wanted is not there: not found, broken, or down for maintenance — said plainly, with the way on.
- `kt-feature-grid` — What the product does, a feature at a time: an icon, a title and a line, in a grid.
- `kt-hero` — The top of a page: what the product is, in a heading and a line, and the way in.
- `kt-pricing-table` — The plans, side by side: what each costs, what it includes, and the way in — with a switch between monthly and yearly prices when the plans have both.

## More

- Every page in one file: https://kanto.arnaudmichel.fr/llms-full.txt
- The documentation, live: https://kanto.arnaudmichel.fr
