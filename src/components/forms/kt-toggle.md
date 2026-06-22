# `<kt-toggle>`

An on/off switch.

```html
<kt-toggle checked>Notifications</kt-toggle>
<kt-toggle size="small" label="Mode sombre"></kt-toggle>
<kt-toggle disabled></kt-toggle>
```

## Sizing

The switch is derived from the field height rather than given fixed pixels:
the track is 1.8× `--switch-height`, and the thumb is inset by 12% of it. So a
toggle lines up with the inputs and buttons next to it, at every size and every
breakpoint, and overriding `--button-height` moves all of them together.

## Switch, not checkbox

`role="switch"` with `aria-checked`, which screen readers announce as "on"/"off"
rather than "checked". Use it for a setting that takes effect immediately. For
something that only applies when a form is submitted, a checkbox is the honest
control.

In a form, an unchecked toggle contributes **nothing** to the submission and a
checked one contributes its `value` — the same rule as a native checkbox.

## API

| Property   | Attribute  | Type                             | Default    |
| ---------- | ---------- | -------------------------------- | ---------- |
| `checked`  | `checked`  | `boolean`                        | `false`    |
| `disabled` | `disabled` | `boolean`                        | `false`    |
| `size`     | `size`     | `'small' \| 'medium' \| 'large'` | `'medium'` |
| `name`     | `name`     | `string`                         | `''`       |
| `value`    | `value`    | `string`                         | `'on'`     |
| `label`    | `label`    | `string`                         | `''`       |

| Event       | Detail                 |
| ----------- | ---------------------- |
| `kt-change` | `{ checked: boolean }` |

| Part    | Description                |
| ------- | -------------------------- |
| `base`  | The `role="switch"` button |
| `track` | The track                  |
| `thumb` | The sliding thumb          |
