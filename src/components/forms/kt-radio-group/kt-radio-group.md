# `<kt-radio-group>`

One choice among a few, all visible at once. The options are `<kt-radio>`
children.

```html
<kt-radio-group label="Billing" name="billing" value="monthly">
  <kt-radio value="monthly">Monthly</kt-radio>
  <kt-radio value="yearly">Yearly — two months free</kt-radio>
  <kt-radio value="custom" disabled>Custom contract</kt-radio>
</kt-radio-group>
```

## Radio group, select or segmented control

- **Radio group** — few enough options to show them all, and seeing them side
  by side helps the choice. Options can be a sentence long.
- **`<kt-select>`** — more options than fit, or the choice is minor.
- **`<kt-segmented-control>`** — two to five short options in a toolbar, such
  as a view switch.

## Keyboard

Native radios cannot form a group across shadow roots, so this is the ARIA
radio group pattern — the one a screen reader expects:

| Key       | Does                                                    |
| --------- | ------------------------------------------------------- |
| `Tab`     | Enters and leaves the group: one tab stop for all of it |
| `↓` / `→` | Next option, and selects it                             |
| `↑` / `←` | Previous option, and selects it                         |
| `Space`   | Selects the focused option                              |

The arrows wrap at the ends and skip disabled options. The tab stop sits on the
chosen option, or on the first enabled one while nothing is chosen.

## In a form

A form control: it submits the chosen `value` under `name`, and nothing while
none is chosen. `required` blocks submission until an option is chosen, `error`
shows a message and marks every option, and `form.reset()` puts back the
initial `value`.

## API

`<kt-radio-group>`

| Property      | Attribute     | Type                         | Default      |
| ------------- | ------------- | ---------------------------- | ------------ |
| `value`       | `value`       | `string \| null`             | `null`       |
| `name`        | `name`        | `string`                     | `''`         |
| `label`       | `label`       | `string`                     | `''`         |
| `disabled`    | `disabled`    | `boolean`                    | `false`      |
| `required`    | `required`    | `boolean`                    | `false`      |
| `orientation` | `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` |
| `error`       | `error`       | `string`                     | `''`         |

`<kt-radio>`

| Property   | Attribute  | Type      | Default |
| ---------- | ---------- | --------- | ------- |
| `value`    | `value`    | `string`  | `''`    |
| `disabled` | `disabled` | `boolean` | `false` |

| Event       | Detail                      |
| ----------- | --------------------------- |
| `kt-change` | `{ value: string \| null }` |

| Part     | Element          | Description                 |
| -------- | ---------------- | --------------------------- |
| `base`   | `kt-radio-group` | The `role="radiogroup"` box |
| `base`   | `kt-radio`       | The `role="radio"` row      |
| `circle` | `kt-radio`       | The drawn circle            |
