# Appearance settings — design

Date: 2026-10-01 · Status: approved in chat, awaiting review of this document

Builds on the accent colour (`2026-10-01-accent-colour-design.md`), on the
same branch, `feat/accent-colour`.

## Goal

Let an app built with Kanto, and a visitor of the docs site, change more than
the accent: the **font**, the **corner radius**, the **density** and the
**text size**. Each is a library API. The docs site gathers them, with the
theme and the accent, in one "Customise" menu.

Decided with Arnaud:

- **Settings:** font, radius, density, text size, on top of theme and accent.
- **Scope:** a library API and the docs site. No public menu component.
- **Theme switch:** it moves into the menu. One button in the top bar.

## What exists

- **Radius.** Components use `--radius-input`, `--border-radius`,
  `--radius-modal`, `--border-radius-card` and `--radius-sub-menu` (about 45
  uses), plus `--radius-pill`/`--radius-full`, which stay as they are. Twelve
  small literal radii (2–6px) sit in breadcrumb, tabs, chart, code, kbd,
  collapsible, multi-select, drag-drop, input, alert, skeleton and toast, and
  `#internal/segmented-field` has one more.
- **Spacing and heights** are tokens in `src/tokens/spacing.css`:
  - `--button-height-small/-/-large` (32/40/48);
  - `--button-padding-x`;
  - the `--padding-*` and `--gap-*` tokens.
- **Type** is composite `font` shorthands in `typography.css`, with px sizes.
  The families are factored into `--font-family-body`/`-display`/`-code`.
- **Mobile.** `responsive.css` redefines the type, spacing and height tokens
  below 600px.

## Design

### 1. Scales as inputs

Following the accent's pattern, each setting is a number input with a
fallback of 1 (or of Kanto's own family). Tokens are written as a function of
it:

| Input                                         | Default        | Read by                                                                                                                                                                                                  |
| --------------------------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--radius-scale`                              | `1`            | `--border-radius`, `--radius-input`, `--radius-modal`, `--border-radius-card`, `--radius-sub-menu`, and the 13 literal radii, each as `calc(Npx * var(--radius-scale, 1))`                               |
| `--density-scale`                             | `1`            | `--button-height-*`, `--button-padding-x`, every `--padding-*` and `--gap-*`, as `round(nearest, calc(Npx * var(--density-scale, 1)), 1px)`. Heights round to 2px so text stays centred on whole pixels. |
| `--text-scale`                                | `1`            | every size and px line-height in the `--font-*` shorthands, as `calc(Npx * var(--text-scale, 1))`                                                                                                        |
| `--font-family-body`, `--font-family-display` | Kanto's stacks | already tokens; presets set them                                                                                                                                                                         |

- `responsive.css` gets the same rewrite, so the scales compose with the
  mobile values.
- Defaults render exactly as today: every computed token value is equal to
  today's in a test.

### 2. Presets — `src/tokens/appearance.css`

Each preset is a data attribute on `<html>` or on any container:

| Attribute        | Values (scale)                                          |
| ---------------- | ------------------------------------------------------- |
| `data-radius`    | `sharp` (0.25) · `default` (1) · `round` (1.75)         |
| `data-density`   | `compact` (0.85) · `default` (1) · `comfortable` (1.15) |
| `data-text-size` | `small` (0.93) · `default` (1) · `large` (1.125)        |
| `data-font`      | `kanto` · `system` · `inter` · `plex` · `geist`         |

Fonts:

- `system`: `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif` for
  both body and display.
- `inter`, `plex` (IBM Plex Sans) and `geist` name their family first, with
  the system stack behind it.
- The code family does not change.

The library ships the Kanto fonts only. An app that picks `inter`, `plex` or
`geist` loads the font itself, and the doc says so. Without the font, the
system stack shows.

**Re-declaring tokens on a container.** As with the accent, a token computed
on `:root` does not see an input set lower down. The token rules therefore
match the attributes too:

```css
:root,
[data-accent],
[data-radius],
[data-density],
[data-text-size],
[data-font]
```

This applies in `colors.css` (already done for `[data-accent]`),
`spacing.css`, `typography.css` and `responsive.css`. The light-theme
selectors follow, e.g. `[data-theme='light'] :is([data-accent], [data-radius], …)`.

### 3. JavaScript API — `src/theme/appearance.ts`, exported from `kanto-ds`

```ts
export interface KtAppearance {
  theme?: 'dark' | 'light' | 'auto';
  accent?: string; // a preset id from KT_ACCENTS, or any colour
  font?: KtFont; // 'kanto' | 'system' | 'inter' | 'plex' | 'geist'
  radius?: KtRadius; // 'sharp' | 'default' | 'round'
  density?: KtDensity; // 'compact' | 'default' | 'comfortable'
  textSize?: KtTextSize; // 'small' | 'default' | 'large'
}
export function setAppearance(appearance: KtAppearance, root?: HTMLElement): void;
export function readAppearance(root?: HTMLElement): Required<KtAppearance>;
export const KT_FONTS, KT_RADII, KT_DENSITIES, KT_TEXT_SIZES; // { id, label, … }[]
```

- `setAppearance` only touches the keys it is given.
  - A `default` (or `kanto`, or `dark`) removes its attribute.
  - An accent that is a preset id sets `data-accent`. Any other colour goes
    through `setAccent`.
  - An unknown preset id throws a `TypeError` naming the accepted values.
- `readAppearance` reads the attributes back, with defaults for those that are
  absent. A custom accent is returned as its `--accent-base`.

### 4. Docs site — one "Customise" menu

- The top bar's theme switch and palette button give way to one icon button,
  `sliders-horizontal`, labelled "Customise".
- Its panel, top to bottom:
  - **Theme:** a segmented control, Dark / Light / Auto.
  - **Accent:** the swatches and the custom colour, as now.
  - **Font:** a radio list, each name set in its own face.
  - **Radius**, **Density**, **Text size:** a segmented control of three for
    each.
  - **Reset:** a text button that puts everything back to Kanto's defaults.
- The whole appearance is stored in `localStorage` (`kanto-docs-appearance`)
  and applied before the first render. The old `kanto-docs-theme` and
  `kanto-docs-accent` keys are read once, as a migration.
- The docs site loads Inter, IBM Plex Sans and Geist from Google Fonts. The
  library does not.

### 5. Documentation

- `src/tokens/README.md`: an "Appearance" section with the attributes,
  `setAppearance`, loading a non-Kanto font, and that scales compose with the
  mobile scale.
- The Guide page "Accent colour" becomes "Appearance", covering all of it.
- CHANGELOG 1.6.0, under Added.

## Testing

- **Defaults unchanged.** Every radius, spacing, height and font token
  computes to today's value, at desktop and at mobile width (browser).
- **Each preset scales its tokens**: `data-radius="round"` gives a 14px
  `--radius-input`, `compact` gives a 34px `--button-height` (40 × 0.85 → 34),
  `large` gives a 16px body size (14 × 1.125 → 15.75, not rounded for text).
- **On a container** inside a light subtree, the presets apply.
- **`setAppearance`/`readAppearance`** round-trip; partial updates leave other
  keys alone; unknown ids throw.
- **Existing size tests pass under each density**: "as tall as a kt-input",
  the radio dot centred, the segmented field.
- **axe** under `compact` + `small` and under `large`.
- **Docs menu:**
  - unit tests of storage, migration and reset;
  - screenshots in both themes and Firefox with several combinations.
- Full `npm run verify` before each commit.

## Out of scope

- Free font choice or font loading by the library.
- A public `kt-appearance-menu` component.
- Changing semantic colours, motion or shadows.
