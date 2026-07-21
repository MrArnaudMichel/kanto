# `<kt-button>`

The Kanto action button. Ten variants, three sizes, an optional Lucide icon.

```html
<kt-button icon="plus">New entity</kt-button>
<kt-button variant="secondary" icon="refresh-cw">Refresh</kt-button>
<kt-button variant="danger">Delete</kt-button>
<kt-button variant="text">View full history</kt-button>
```

## Choosing a variant

| Variant                    | Use for                                                         |
| -------------------------- | --------------------------------------------------------------- |
| `primary`                  | The one action a screen is about. At most one per view.         |
| `secondary`                | Supporting actions. Soft indigo tint.                           |
| `secondary-no-bg`          | The same, with no resting background — for toolbars.            |
| `dark`                     | Neutral actions that must not compete for attention.            |
| `danger`                   | Destructive, but recoverable. Tinted red.                       |
| `delete`                   | Irreversible. The only solid red in the system — use sparingly. |
| `warning` `info` `success` | Status-carrying actions inside a matching context.              |
| `text`                     | Inline, link-like. No padding, no height.                       |

## Icon-only

An `icon` with no slotted text collapses the button to a square. It then has no
accessible name of its own, so `label` is required:

```html
<kt-button icon="x" label="Close" variant="secondary-no-bg"></kt-button>
```

## Forms

A button inside a shadow root is invisible to the enclosing form, so
`type="submit"` would normally do nothing. `<kt-button>` bridges that: it runs
the form's constraint validation, fires a real `submit` event, and carries
`name` / `value` into the submission.

```html
<form>
  <kt-input name="email" type="email" required></kt-input>
  <kt-button type="submit">Send</kt-button>
</form>
```

## API

| Property       | Attribute       | Type                              | Default     |
| -------------- | --------------- | --------------------------------- | ----------- |
| `variant`      | `variant`       | see table above                   | `'primary'` |
| `size`         | `size`          | `'small' \| 'medium' \| 'large'`  | `'medium'`  |
| `disabled`     | `disabled`      | `boolean`                         | `false`     |
| `type`         | `type`          | `'button' \| 'submit' \| 'reset'` | `'button'`  |
| `icon`         | `icon`          | `string`                          | `''`        |
| `iconPosition` | `icon-position` | `'left' \| 'right'`               | `'left'`    |
| `label`        | `label`         | `string`                          | `''`        |
| `fullWidth`    | `full-width`    | `boolean`                         | `false`     |
| `name`         | `name`          | `string`                          | `''`        |
| `value`        | `value`         | `string`                          | `''`        |

| Slot      | Description      |
| --------- | ---------------- |
| _default_ | The button label |

| Part     | Description           |
| -------- | --------------------- |
| `button` | The native `<button>` |
| `icon`   | The icon, when set    |

Emits no custom events — listen for `click` as on any button.
