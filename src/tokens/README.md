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
| `fonts.css`       | `@font-face` for Manrope / Mulish / SCP        | yes      |
| `base.css`        | Global element styles for the host application | yes      |
| `index.css`       | Imports the five non-optional files            | —        |

## Usage

```js
import 'kanto-ds/styles.css'; // fonts + tokens + base
```

or, to keep Kanto out of the host's global styles:

```js
import 'kanto-ds/tokens/index.css'; // variables only
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

## Accent colour

Kanto ships violet. Seven presets are a data attribute away, on the page or on
any container:

```html
<html data-accent="blue"></html>
```

`violet` · `blue` · `teal` · `green` · `orange` · `pink` · `slate`

Any other colour goes through `setAccent`, which solves the variants for it:

```js
import { setAccent } from 'kanto-ds';

setAccent('#e11d48'); // the page
setAccent('#e11d48', panel); // one container
setAccent(null); // back to the preset or the default
```

Whatever the colour, white text reads on a primary fill at 4.5:1 or more, and
the accent as text reads at 4.5:1 or more on the surfaces and on its own tint,
in both themes. A bright colour — a yellow, a light orange — is darkened for
it, as Kanto's own violet is. The neutral surfaces take a trace of the accent's
hue; a grey accent gives plain greys.

`accentPalette(color)` returns the values without applying them — to write
them into a stylesheet at build time, for instance. The inputs it sets are
`--accent-base`, `--accent-hover`, `--accent-text-dark`, `--accent-text-light`,
`--accent-wash`, `--neutral-hue` and `--neutral-chroma`; components never read
them, only the tokens do.

A red or a green accent sits close to the danger and success colours; Kanto
does not stop you, but a primary button and a destructive one will look
alike.

## Conventions

- **Surfaces are a ramp, not a shadow scale.** Elevation means a lighter
  surface: `--color-dark-12` (page) → `--color-dark-16` (card) →
  `--color-dark-20` (raised). Shadows are kept for what floats over the page:
  toasts, and popovers in the light theme.
- **Popovers have their own surface.** Lists, menus and calendars that open
  over the page use `--surface-popover`, `--border-popover`,
  `--shadow-popover` and, for lines inside them, `--divider-popover`. In the
  dark the ramp sets them apart alone — a lighter surface, no edge, no shadow.
  In the light a darker step reads as a grey smudge and fades what sits on it,
  and white alone is lost on a near-white page: white, then, with an edge and a
  soft shadow.
- **Semantic colours come in four variants.** `-base` is opaque, for solid
  fills; `-soft` is the same hue at 12% alpha, for tinted backgrounds; `-hover`
  is 16%; `-text` is for text and icons. Never colour text with `-base`: it is
  tuned to carry white text, which makes it too dark on a dark surface and too
  light on a light one. Every `-text` holds WCAG AA (4.5:1) on the page, card
  and raised surfaces and on its own tint. `--color-danger-solid` is the red for a
  filled destructive button.
- **Prefer the aliases.** `--surface-card` over `--color-dark-16`,
  `--text-muted` over `--color-text-400`. The aliases survive a change to which
  ramp step a role uses.
- **Type is applied whole.** `font: var(--font-normal-medium)` sets weight, size,
  line height and family in one declaration; there is no `--font-size-*` scale
  to get half-applied.
- **Inputs take an outline, never a border.** A border would reflow the field on
  focus; `--outline-width` sits outside the box.
