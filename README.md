# Kanto

**Dark-first design system for data-dense product interfaces** — dashboards,
admin tools, forms.

Kanto is the framework-agnostic successor to
[`kanto-ng`](https://github.com/MrArnaudMichel/kanto-ng). The components are
standard custom elements, so they run in React, Vue, Angular, Svelte or plain
HTML without a per-framework rewrite.

```bash
npm install kanto-ds
```

```js
import 'kanto-ds';
import 'kanto-ds/styles.css';
```

```html
<kt-card>
  <h6 slot="header">Transactions récentes</h6>
  <kt-table></kt-table>
  <kt-button slot="footer" variant="text">Voir tout l'historique</kt-button>
</kt-card>
```

---

## Why custom elements

One implementation, every framework. The alternative — a React port, a Vue
port, an Angular library — is three codebases drifting apart, and this project
started as exactly that drift.

The trade is real and worth naming: custom elements need JavaScript to upgrade,
so they render unstyled-but-present during SSR until the bundle lands. In
return, a component is written once and a fix reaches every consumer at the same
time.

See **[docs/frameworks.md](docs/frameworks.md)** for the per-framework setup.
Two rules hold everywhere:

- **Data goes in as properties, not attributes.** `options`, `data`, `columns`,
  `items` — anything that is not a string or a boolean. An attribute can only
  hold a string.
- **Events are `kt-`-prefixed CustomEvents**, payload in `detail`. They bubble
  and cross shadow boundaries, so you can listen on a container.

## The system

**Dark is canonical.** `:root` carries the dark palette; light is opt-in with
`data-theme="light"`, or `data-theme="auto"` to follow the OS. Both use the same
token names, so no component has theme-specific CSS.

**Elevation is a lighter surface, not a shadow.** Surfaces are an eleven-step
ramp, `--color-dark-8` through `--color-dark-24`. The only real shadow in the
system is on toasts, which genuinely float.

**Fields take an outline, never a border.** A border would reflow the field on
focus; the outline sits outside the box — grey on hover, primary on focus,
danger on error.

**Motion is fast and utilitarian.** 100–200ms, no bounces, no springs. The one
decorative animation is the striped progress bar, and it earns its place: it is
how an operation says it is still working when the number is not moving.

**Copy is French.** "Rechercher partout...", "Aucune donnée à afficher",
"il y a 2 min". Sentence case for labels, uppercase only for overline section
titles. No emoji in product UI.

Full details in **[src/tokens/README.md](src/tokens/README.md)**.

## Components

Twenty-three elements. Each has a `README`-style page beside its source.

| Group          | Elements                                                                                                                                                                                                                                                                                                                                                  |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Core**       | [button](src/components/core/kt-button.md) · [card](src/components/core/kt-card.md) · [chip](src/components/core/kt-chip.md) · [icon](src/components/core/kt-icon.md)                                                                                                                                                                                     |
| **Forms**      | [input](src/components/forms/kt-input.md) · [textarea](src/components/forms/kt-textarea.md) · [label-input](src/components/forms/kt-label-input.md) · [select](src/components/forms/kt-select.md) · [input-menu](src/components/forms/kt-input-menu.md) · [toggle](src/components/forms/kt-toggle.md) · [drag-drop](src/components/forms/kt-drag-drop.md) |
| **Navigation** | [breadcrumb](src/components/navigation/kt-breadcrumb.md) · [sub-menu-navigation](src/components/navigation/kt-sub-menu-navigation.md) · [segmented-control](src/components/navigation/kt-segmented-control.md) · [toggle-button + group](src/components/navigation/kt-toggle-button.md)                                                                   |
| **Feedback**   | [progress-bar](src/components/feedback/kt-progress-bar.md) · [skeleton](src/components/feedback/kt-skeleton.md) · [tooltip](src/components/feedback/kt-tooltip.md) · [toast + container + toaster](src/components/feedback/kt-toast.md)                                                                                                                   |
| **Overlays**   | [dropdown](src/components/overlays/kt-dropdown.md) · [side-panel](src/components/overlays/kt-side-panel.md) · [confirm-dialog](src/components/overlays/kt-confirm-dialog.md)                                                                                                                                                                              |
| **Data**       | [table](src/components/data/kt-table.md) · [pagination](src/components/data/kt-pagination.md)                                                                                                                                                                                                                                                             |

Import the whole system, or one element:

```js
import 'kanto-ds'; // everything
import 'kanto-ds/components/core/kt-button'; // just this one
```

## Icons

`<kt-icon>` resolves [Lucide](https://lucide.dev) icons by name at render time,
which means the set cannot be tree-shaken. So Kanto ships only the seventeen its
own elements draw. Register what your application uses:

```js
import { Rocket, Wallet } from 'lucide';
import { registerIcons } from 'kanto-ds/icons';

registerIcons({ Rocket, Wallet }); // <kt-icon name="rocket">
```

## Forms

Every field is a form-associated custom element. It serialises into `FormData`
under its `name`, resets with the form, and reports validity like a native
input — no hidden mirror inputs, no manual wiring.

```html
<form>
  <kt-label-input label="Adresse e-mail" required>
    <kt-input name="email" type="email" required></kt-input>
  </kt-label-input>
  <kt-button type="submit">Envoyer</kt-button>
</form>
```

## Accessibility

Not a phase at the end; it is why several of these components exist in this
shape. Some of what that meant:

- The segmented control is a **radio group**: one tab stop, arrows to move.
- Sortable table headers are **buttons** — a header you can only sort with a
  mouse is a table half the users cannot sort.
- The side panel and confirm dialog are native `<dialog>`s: top layer, trapped
  focus, inert background, Escape handled by the platform.
- The confirm dialog focuses **Cancel**, not Confirm.
- Tooltips are dismissible with Escape, and are never a control's only name.
- Every motion respects `prefers-reduced-motion`, through the token layer.

## Development

```bash
npm install
npm run dev          # the documentation site, on src/
npm test             # 228 tests
npm run typecheck
npm run lint
npm run build        # JS, types, and the static CSS + fonts
```

The docs site is built from the design system itself, so a broken component
breaks its own documentation.

## Licence

MIT. The bundled webfonts — Manrope, Mulish and Source Code Pro — are under
the SIL Open Font License 1.1; see
[src/assets/fonts/README.md](src/assets/fonts/README.md).
