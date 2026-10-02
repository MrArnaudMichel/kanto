# `<kt-number-input>`

A number field with − and + beside it: a quantity, a seat count, an amount.

```html
<kt-number-input label="Seats" min="1" max="50" value="5"></kt-number-input>
```

```js
amount.formatOptions = { style: 'currency', currency: 'EUR' };
```

## Typing and stepping

Type a number the way your language writes one — `1 234,5` in French,
`1,234.5` in English — or step it:

| Key            | Does                 |
| -------------- | -------------------- |
| `↑` / `↓`      | one step up or down  |
| `Page Up/Down` | ten steps            |
| `Home`/`End`   | to `min` or `max`    |
| `Enter`        | reads what was typed |

The − and + buttons step too, and grey out at the bounds. They stay out of the
tab order: the arrows already do their work from the field.

What is typed is read when the field is left, or on Enter, and kept within
`min` and `max` and on `step`. Text that is no number puts back the value the
field had; an emptied field holds `null`.

## Reading at rest

While the field has the focus it shows the plain number, easy to edit. At rest
it reads the way the locale writes it, through `formatOptions` — any
`Intl.NumberFormat` option: a currency, a percentage, a unit, a number of
decimals. A screen reader hears that text as the value.

## In a form

A form control: it submits the number under `name`, and nothing while empty.
`required` blocks submission while it is empty, `error` shows a message, and
`form.reset()` puts back the first value.

## API

| Property        | Attribute     | Type                             | Default            |
| --------------- | ------------- | -------------------------------- | ------------------ |
| `value`         | `value`       | `number \| null`                 | `null`             |
| `min`           | `min`         | `number`                         | none               |
| `max`           | `max`         | `number`                         | none               |
| `step`          | `step`        | `number`                         | `1`                |
| `formatOptions` | —             | `Intl.NumberFormatOptions`       | `{}`               |
| `locale`        | `locale`      | `string`                         | page, then browser |
| `name`          | `name`        | `string`                         | `''`               |
| `label`         | `label`       | `string`                         | `''`               |
| `placeholder`   | `placeholder` | `string`                         | `''`               |
| `size`          | `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`         |
| `disabled`      | `disabled`    | `boolean`                        | `false`            |
| `required`      | `required`    | `boolean`                        | `false`            |
| `error`         | `error`       | `string`                         | `''`               |

| Event       | Detail                      |
| ----------- | --------------------------- |
| `kt-change` | `{ value: number \| null }` |

| Part       | Description    |
| ---------- | -------------- |
| `field`    | The field      |
| `input`    | The text field |
| `decrease` | The − button   |
| `increase` | The + button   |

## Accessibility

The field is a `spinbutton` with its bounds, its value and the text it shows;
`error` is announced with it.
