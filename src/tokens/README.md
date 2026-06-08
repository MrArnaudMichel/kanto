# Token layer

Every visual decision in Kanto resolves to a CSS custom property declared on
`:root`. Components never hard-code a colour, a size or a duration.

Custom properties inherit _through_ shadow roots, which is what makes this work
for web components: an app can restyle every Kanto element by redefining a
token on `:root`, without piercing a single shadow boundary.

## Files

| File              | Contents                                       | Optional |
| ----------------- | ---------------------------------------------- | -------- |
| `colors.css`      | Dark palette, surfaces, text ramp, aliases     | no       |
| `theme-light.css` | Light remap of the same names                  | no       |
| `typography.css`  | Families and composite `font` shorthands       | no       |
| `spacing.css`     | Radius, padding, gap, dimensions, motion, `z`  | no       |
| `responsive.css`  | Breakpoint overrides + reduced-motion          | no       |
| `fonts.css`       | `@font-face` for Gilroy / Avenir Next / SCP    | yes      |
| `base.css`        | Global element styles for the host application | yes      |
| `index.css`       | Imports the five non-optional files            | —        |

## Usage

```js
import 'kanto/styles.css'; // fonts + tokens + base
```

or, to keep Kanto out of the host's global styles:

```js
import 'kanto/tokens/index.css'; // variables only
```

## Theming

Dark is the canonical theme and is what `:root` carries.

```html
<html data-theme="light">
  <!-- forced light -->
  <html data-theme="auto">
    <!-- follows the OS -->
  </html>
</html>
```

## Conventions

- **Surfaces are a ramp, not a shadow scale.** Elevation means a lighter
  surface: `--color-dark-12` (page) → `--color-dark-16` (card) →
  `--color-dark-20` (raised). The only shadow in the system is on toasts.
- **Semantic colours come in three variants.** `-base` is opaque, for text and
  solid fills; `-soft` is the same hue at 12% alpha, for tinted backgrounds;
  `-hover` is 16%.
- **Prefer the aliases.** `--surface-card` over `--color-dark-16`,
  `--text-muted` over `--color-text-400`. The aliases survive a change to which
  ramp step a role uses.
- **Type is applied whole.** `font: var(--font-normal-medium)` sets weight, size,
  line height and family in one declaration; there is no `--font-size-*` scale
  to get half-applied.
- **Inputs take an outline, never a border.** A border would reflow the field on
  focus; `--outline-width` sits outside the box.
