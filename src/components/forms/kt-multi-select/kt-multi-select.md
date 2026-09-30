# `<kt-multi-select>`

Several choices from a list: type to narrow it, pick as many as you need.

```html
<kt-multi-select label="Regions" placeholder="Any region"></kt-multi-select>
```

```js
select.options = [
  { id: 'ne', label: 'North East' },
  { id: 'sw', label: 'South West' },
  { id: 'nw', label: 'North West' },
];
select.value = ['ne'];

select.addEventListener('kt-change', (e) => filter(e.detail.value));
```

## Against the alternatives

Reach for it when a filter takes several values from a list long enough to
search — regions, owners, tags. For two or three options that all fit on
screen, a `<kt-toggle-button-group multiple>` shows them without a click. For
one value, `<kt-input-menu>` or `<kt-select>`.

## One line, whatever is chosen

Each choice shows in the field as a chip with its own remove button. The field
keeps to one line: the chips that do not fit collapse into a **+N** beside the
ones that do, so the field sits in a row of filters without changing its height.
The open list shows every option, the chosen ones ticked — which is where the
hidden ones can be seen and taken out. Widen the field and more chips come
back.

## Choosing

The list stays open after each choice, since the point is to make several.
Clicking a chosen option, or pressing Enter on it, takes it out again; the
order of `value` is the order things were chosen. Disabled options can be seen
but not chosen.

`kt-change` fires with the whole new `value` and the matching `options`, not
the one that changed: a filter usually wants the full set.

## Server-side filtering

`kt-filter` fires on every keystroke, as on `<kt-input-menu>`: assign the
results to `options` and the list follows. Chosen values stay chosen while
their options are filtered out — a chip whose option is no longer in `options`
shows its id.

```js
select.addEventListener('kt-filter', async (e) => {
  select.options = await search(e.detail.query);
});
```

## In a form

A form control, submitted like `<select multiple>`: one entry per chosen id
under `name`, and nothing at all while empty — read them with
`formData.getAll(name)`. `required` blocks submission until at least one value
is chosen, `form.reset()` puts back the values it started with, and a
`<fieldset disabled>` disables it.

## Accessibility

The field is an ARIA combobox over a listbox marked `aria-multiselectable`,
each option `aria-selected` when chosen. The number chosen is part of the
field's description ("2 selected"), since the chips may not all be visible.
Each chip's remove button is named after it — "Remove North East".

## Keyboard

| Key            | Does                                               |
| -------------- | -------------------------------------------------- |
| `↓` / `↑`      | Opens the list, then moves the active option       |
| `Home` / `End` | First / last match                                 |
| `Enter`        | Adds or removes the active option; the list stays  |
| `Backspace`    | In an empty field, removes the last chip           |
| `Escape`       | Closes and forgets the query, keeping every choice |
| `Tab`          | Closes and moves on                                |

## API

| Property      | Attribute     | Type                   | Default         |
| ------------- | ------------- | ---------------------- | --------------- |
| `options`     | —             | `KtOption[]`           | `[]`            |
| `value`       | —             | `(string \| number)[]` | `[]`            |
| `placeholder` | `placeholder` | `string`               | `''`            |
| `name`        | `name`        | `string`               | `''`            |
| `disabled`    | `disabled`    | `boolean`              | `false`         |
| `required`    | `required`    | `boolean`              | `false`         |
| `error`       | `error`       | `string`               | `''`            |
| `label`       | `label`       | `string`               | `''`            |
| `emptyText`   | `empty-text`  | `string`               | `'No options…'` |

`selectedOptions` (read-only) is the chosen options, in the order chosen.

| Event       | Detail               |
| ----------- | -------------------- |
| `kt-change` | `{ value, options }` |
| `kt-filter` | `{ query: string }`  |

| Part      | Description          |
| --------- | -------------------- |
| `control` | The field            |
| `chips`   | The row of chips     |
| `input`   | The native `<input>` |
| `popup`   | The option list      |
| `option`  | An option row        |
