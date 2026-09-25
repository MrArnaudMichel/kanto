# `<kt-checkbox>`

A checkbox: a choice that applies when the form is submitted.

```html
<kt-checkbox name="updates" checked>Send me product updates</kt-checkbox>
<kt-checkbox name="terms" required>I accept the terms</kt-checkbox>
<kt-checkbox indeterminate>Select all</kt-checkbox>
<kt-checkbox disabled>Unavailable</kt-checkbox>
```

## Checkbox, toggle or radio

- **Checkbox** — the choice takes effect when the form is submitted, or it is
  one of several independent choices in a list.
- **`<kt-toggle>`** — a setting that applies the moment it is flipped.
- **`<kt-radio-group>`** — exactly one choice among a few.

## Built on the native input

Under the drawn box sits a real `<input type="checkbox">`, invisible but
covering it. The keyboard (Space), the click on the label, the indeterminate
state and what a screen reader announces all come from the platform, so they
behave exactly like every other checkbox the user has met.

The slotted text is the label: clicking it toggles the box, and it names the
checkbox for assistive technology. With nothing slotted — a checkbox in a table
row — give it a `label` instead.

## Indeterminate

`indeterminate` draws a dash: neither checked nor unchecked, for a "select all"
over a partial selection. It is display state only, as on a native checkbox —
the first click clears it and checks the box.

## In a form

A form control, like a native checkbox: it submits its `value` (default `on`)
under `name` when checked, and **nothing** when unchecked. `required` blocks
submission until it is checked, `error` shows a message and puts it in its
error state, and `form.reset()` puts back the initial state.

## API

| Property        | Attribute       | Type                             | Default    |
| --------------- | --------------- | -------------------------------- | ---------- |
| `checked`       | `checked`       | `boolean`                        | `false`    |
| `indeterminate` | `indeterminate` | `boolean`                        | `false`    |
| `disabled`      | `disabled`      | `boolean`                        | `false`    |
| `required`      | `required`      | `boolean`                        | `false`    |
| `size`          | `size`          | `'small' \| 'medium' \| 'large'` | `'medium'` |
| `name`          | `name`          | `string`                         | `''`       |
| `value`         | `value`         | `string`                         | `'on'`     |
| `label`         | `label`         | `string`                         | `''`       |
| `error`         | `error`         | `string`                         | `''`       |

| Event       | Detail                 |
| ----------- | ---------------------- |
| `kt-change` | `{ checked: boolean }` |

| Part    | Description                 |
| ------- | --------------------------- |
| `base`  | The `<label>` around it all |
| `input` | The native checkbox         |
| `box`   | The drawn box               |
