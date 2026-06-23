# `<kt-select>`

A single-choice dropdown.

```html
<kt-select placeholder="Sélectionner une région" name="region"></kt-select>
```

```js
select.options = [
  { id: 'idf', label: 'Île-de-France' },
  { id: 'bzh', label: 'Bretagne' },
  { id: 'paca', label: "Provence-Alpes-Côte d'Azur", disabled: true },
];

select.addEventListener('kt-change', (e) => console.log(e.detail.value, e.detail.option));
```

`options` is a **property, not an attribute** — it is data, and serialising an
array of objects through an HTML attribute is a mistake you only make once.

## Keyboard

This is a real listbox, not a button next to a floating div:

| Key               | Does                                         |
| ----------------- | -------------------------------------------- |
| `↓` / `↑`         | Opens the list, then moves the active option |
| `Home` / `End`    | Jumps to the first / last selectable option  |
| `Enter` / `Space` | Opens, then commits the active option        |
| `Escape`          | Closes, changing nothing                     |
| `Tab`             | Closes and moves on                          |

Disabled options are skipped by the arrows rather than merely being
unclickable, and the trigger carries `aria-activedescendant` so a screen reader
follows the highlight.

## Animation

The popup stays in the DOM and animates through `opacity` and `transform`, held
out of the way with `visibility: hidden`. A popup that unmounts cannot animate
out; one that only toggles `display` cannot animate at all.

## API

| Property      | Attribute     | Type                             | Default            |
| ------------- | ------------- | -------------------------------- | ------------------ |
| `options`     | —             | `KtOption[]`                     | `[]`               |
| `value`       | `value`       | `string \| number \| null`       | `null`             |
| `placeholder` | `placeholder` | `string`                         | `'Sélectionner'`   |
| `name`        | `name`        | `string`                         | `''`               |
| `size`        | `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`         |
| `disabled`    | `disabled`    | `boolean`                        | `false`            |
| `required`    | `required`    | `boolean`                        | `false`            |
| `error`       | `error`       | `string`                         | `''`               |
| `clearable`   | `clearable`   | `boolean`                        | `true`             |
| `label`       | `label`       | `string`                         | `''`               |
| `emptyText`   | `empty-text`  | `string`                         | `'Aucune option…'` |

```ts
interface KtOption {
  id: string | number;
  label?: string; // falls back to String(id)
  disabled?: boolean;
}
```

| Getter           | Returns                             |
| ---------------- | ----------------------------------- |
| `selectedOption` | The chosen `KtOption`, or undefined |

| Event       | Detail                                                          |
| ----------- | --------------------------------------------------------------- |
| `kt-change` | `{ value: string \| number \| null, option: KtOption \| null }` |

| Part      | Description     |
| --------- | --------------- |
| `trigger` | The button      |
| `popup`   | The option list |
| `option`  | An option row   |
