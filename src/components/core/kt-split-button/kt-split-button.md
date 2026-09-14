# `<kt-split-button>`

One button carrying a menu of related actions. The body runs the action a user
wants nine times out of ten; the caret opens the rest.

```html
<kt-split-button>Save</kt-split-button>
```

```js
save.items = [
  { id: 'close', label: 'Save and close' },
  { id: 'copy', label: 'Save a copy' },
  { id: 'pdf', label: 'Export as PDF', icon: 'file' },
  { id: 'discard', label: 'Discard changes', variant: 'danger' },
];
save.addEventListener('click', () => save());
save.addEventListener('kt-select', (e) => run(e.detail.value));
```

## When not to use it

**The rows must be variations on the primary action.** "Save and close" belongs
under "Save"; "Delete" does not. For an unrelated set of actions there is no
default worth promoting — use `<kt-dropdown>`, which offers none.

**One primary button per screen still holds.** A split button is one button,
not two, so it counts once.

## The two segments

A press on the caret never surfaces as a `click` on the host. A single `click`
listener therefore means the primary action and nothing else — no checking what
was pressed, no accidental double handling.

`variant` and `size` are forwarded to both segments, so the pair always reads as
one control. The seam between them is a hairline of the page showing through,
the same way elevation works everywhere else in the system.

## Items

| Field      | Type                    |                                 |
| ---------- | ----------------------- | ------------------------------- |
| `id`       | `string \| number`      | Carried in `kt-select`          |
| `label`    | `string`                | Falls back to `id`              |
| `icon`     | `string`                | Lucide name, kebab-case         |
| `disabled` | `boolean`               | Stays visible, cannot be chosen |
| `variant`  | `'default' \| 'danger'` | `danger` tints the row red      |

## Keyboard

| Key                 | Does                                        |
| ------------------- | ------------------------------------------- |
| `Enter` / `Space`   | Runs the focused segment or row             |
| `Arrow down` / `up` | Walks the rows, wrapping, skipping disabled |
| `Home` / `End`      | First / last selectable row                 |
| `Escape`            | Closes the menu                             |

Opening the menu moves focus to the first selectable row. Closing it hands
focus back to the caret — unless a click outside already took focus elsewhere,
in which case it is left where the user put it.

## Placement

The menu hangs off the right edge of the button and flips above it when there is
not enough room below. `preferred-placement="top"` reverses the preference.

## API

| Property             | Attribute             | Type                             | Default          |
| -------------------- | --------------------- | -------------------------------- | ---------------- |
| `items`              | —                     | `KtSplitButtonItem[]`            | `[]`             |
| `variant`            | `variant`             | same ten as `<kt-button>`        | `'primary'`      |
| `size`               | `size`                | `'small' \| 'medium' \| 'large'` | `'medium'`       |
| `disabled`           | `disabled`            | `boolean`                        | `false`          |
| `icon`               | `icon`                | `string`                         | `''`             |
| `menuLabel`          | `menu-label`          | `string`                         | `'More actions'` |
| `preferredPlacement` | `preferred-placement` | `'bottom' \| 'top'`              | `'bottom'`       |
| `emptyText`          | `empty-text`          | `string`                         | `'No actions'`   |

| Method / getter | Description                 |
| --------------- | --------------------------- |
| `show()`        | Opens the menu              |
| `hide()`        | Closes it                   |
| `toggle()`      | Either                      |
| `isOpen`        | Whether it is open          |
| `focus()`       | Focuses the primary segment |

| Event       | Detail                      |
| ----------- | --------------------------- |
| `click`     | native — the primary action |
| `kt-select` | `{ value, item }`           |
| `kt-open`   | —                           |
| `kt-close`  | —                           |

| Slot      | Description                |
| --------- | -------------------------- |
| _default_ | The primary action's label |

| Part     | Description                        |
| -------- | ---------------------------------- |
| `action` | The primary `<kt-button>`          |
| `caret`  | The `<kt-button>` opening the menu |
| `menu`   | The list of rows                   |
| `item`   | A menu row                         |
