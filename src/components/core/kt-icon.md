# `<kt-icon>`

A [Lucide](https://lucide.dev) icon, resolved from the registry by name.

Default 24px, stroke width 2, drawn in `currentColor` — the icon takes the
colour of the text around it, with no attribute to keep in sync.

```html
<kt-icon name="search"></kt-icon>
<kt-icon name="trash-2" size="16"></kt-icon>
<kt-icon name="circle-alert" style="color: var(--color-danger-base)"></kt-icon>
```

## Registering icons

Kanto ships only the seventeen icons its own elements draw. Register whatever
else the application uses, once, at start-up:

```js
import { Rocket, Wallet } from 'lucide';
import { registerIcons } from 'kanto-ds/icons';

registerIcons({ Rocket, Wallet }); // now <kt-icon name="rocket">
```

Names normalise to kebab-case, so `Rocket`, `rocket` and `ROCKET` all resolve
to `rocket`.

Prototyping and can afford the weight? Register the lot:

```js
import * as lucide from 'lucide';
registerIcons(lucide); // ~2000 icons, do not ship this
```

## Accessibility

By default the icon is `aria-hidden` — correct for the common case, where it
sits next to text that already names the action.

Give it a `label` only when it carries meaning alone, which makes it
`role="img"` with that accessible name:

```html
<!-- text says it; icon is decoration -->
<kt-button icon="trash-2">Delete</kt-button>

<!-- icon says it; it needs a name -->
<kt-icon name="trash-2" label="Delete"></kt-icon>
```

## API

| Property      | Attribute      | Type     | Default | Description                       |
| ------------- | -------------- | -------- | ------- | --------------------------------- |
| `name`        | `name`         | `string` | `''`    | Registered icon name, kebab-case. |
| `size`        | `size`         | `number` | `24`    | Width and height, in pixels.      |
| `strokeWidth` | `stroke-width` | `number` | `2`     | SVG stroke width.                 |
| `label`       | `label`        | `string` | `''`    | Accessible name. Empty = hidden.  |

| Part  | Description      |
| ----- | ---------------- |
| `svg` | The `<svg>` root |

An unknown name renders an empty box of the right size and warns once in the
console — a typo shifts no layout while you find it.
