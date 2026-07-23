# `<kt-input-menu>`

A combobox: type to narrow the list, then pick.

```html
<kt-input-menu placeholder="Search a country"></kt-input-menu>
```

```js
menu.options = [
  { id: 'fr', label: 'France' },
  { id: 'be', label: 'Belgium' },
  { id: 'ch', label: 'Switzerland' },
];

menu.addEventListener('kt-change', (e) => console.log(e.detail.value));
menu.addEventListener('kt-filter', (e) => console.log(e.detail.query));
```

## Against `<kt-select>`

Both choose one option from a list. Reach for the combobox once scanning the
list is slower than typing three letters — roughly twenty options. Below that,
`<kt-select>` is less work for the user: no typing, and the whole list is
visible.

## One field, two jobs

While the list is open and a query has been typed, the field shows the query.
Otherwise it shows the chosen option's label. That single field is what makes
this a combobox rather than a search box that happens to sit above a list.

Escape closes and forgets the query, leaving the previous selection intact.

## Server-side filtering

`kt-filter` fires on every keystroke, so a large or remote list can be fetched
instead of filtered locally — assign the results back to `options` and the
element renders them.

```js
menu.addEventListener('kt-filter', async (e) => {
  menu.options = await search(e.detail.query);
});
```

## Keyboard

| Key            | Does                                           |
| -------------- | ---------------------------------------------- |
| `↓` / `↑`      | Opens the list, then moves the active option   |
| `Home` / `End` | First / last match                             |
| `Enter`        | Commits the active option                      |
| `Escape`       | Closes, forgets the query, keeps the selection |
| `Tab`          | Closes and moves on                            |

The arrows walk the **filtered** list, not the full one.

## API

| Property      | Attribute     | Type                       | Default         |
| ------------- | ------------- | -------------------------- | --------------- |
| `options`     | —             | `KtOption[]`               | `[]`            |
| `value`       | `value`       | `string \| number \| null` | `null`          |
| `placeholder` | `placeholder` | `string`                   | `''`            |
| `disabled`    | `disabled`    | `boolean`                  | `false`         |
| `error`       | `error`       | `string`                   | `''`            |
| `label`       | `label`       | `string`                   | `''`            |
| `emptyText`   | `empty-text`  | `string`                   | `'No options…'` |

| Event       | Detail              |
| ----------- | ------------------- |
| `kt-change` | `{ value, option }` |
| `kt-filter` | `{ query: string }` |

| Part      | Description          |
| --------- | -------------------- |
| `control` | The field            |
| `input`   | The native `<input>` |
| `popup`   | The option list      |
| `option`  | An option row        |
