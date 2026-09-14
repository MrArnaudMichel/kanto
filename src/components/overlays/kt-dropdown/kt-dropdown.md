# `<kt-dropdown>`

A panel anchored to a trigger. The generic overlay in the system.

```html
<kt-dropdown>
  <kt-button slot="trigger" variant="dark" icon="ellipsis" label="Actions"></kt-button>
</kt-dropdown>
```

```js
menu.options = [
  { id: 'edit', label: 'Edit' },
  { id: 'delete', label: 'Delete' },
];
menu.addEventListener('kt-select', (e) => run(e.detail.value));
```

Leave `options` empty and slot arbitrary content into `panel` instead — a
filter form, a colour picker, a preview.

**For choosing a value in a form, use `<kt-select>` or `<kt-input-menu>`.** They
carry the listbox semantics and the keyboard model this element deliberately
does not assume; a dropdown is a menu of actions.

## Placement

The panel goes below the trigger, and flips above it when there is not enough
room — or, when neither side fits, to whichever has more. Set
`preferred-placement="top"` to reverse the preference.

Placement is recalculated on open and on window resize.

Horizontally the panel lines up with the trigger's left edge. `align="end"`
lines it up with the right edge instead — for a trigger that sits at the right
of the thing it belongs to, such as the caret of a `<kt-split-button>`.

## API

| Property             | Attribute             | Type                       | Default        |
| -------------------- | --------------------- | -------------------------- | -------------- |
| `options`            | —                     | `KtOption[]`               | `[]`           |
| `value`              | `value`               | `string \| number \| null` | `null`         |
| `preferredPlacement` | `preferred-placement` | `'bottom' \| 'top'`        | `'bottom'`     |
| `align`              | `align`               | `'start' \| 'end'`         | `'start'`      |
| `disabled`           | `disabled`            | `boolean`                  | `false`        |
| `emptyText`          | `empty-text`          | `string`                   | `'No results'` |

| Method / getter | Description           |
| --------------- | --------------------- |
| `show()`        | Opens the panel       |
| `hide()`        | Closes it             |
| `toggle()`      | Either                |
| `isOpen`        | Whether it is showing |

| Event       | Detail              |
| ----------- | ------------------- |
| `kt-select` | `{ value, option }` |
| `kt-open`   | —                   |
| `kt-close`  | —                   |

| Slot      | Description                 |
| --------- | --------------------------- |
| `trigger` | What opens the panel        |
| `panel`   | Contents, without `options` |
