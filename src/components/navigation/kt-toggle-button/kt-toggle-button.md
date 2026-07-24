# `<kt-toggle-button>`

A button that stays pressed.

```html
<kt-toggle-button icon="bold" label="Bold"></kt-toggle-button>
<kt-toggle-button variant="outline" value="draft">Draft</kt-toggle-button>
```

`aria-pressed`, not `aria-checked`: this is a control holding a state, not one
option among several. When they _are_ options among several and only one may be
active, reach for [`<kt-segmented-control>`](../kt-segmented-control/kt-segmented-control.md)
or [`<kt-tabs>`](../kt-tabs/kt-tabs.md) — they carry the right semantics and the
right keyboard model.

To draw several as one bar, wrap them in
[`<kt-toggle-button-group>`](../kt-toggle-button-group/kt-toggle-button-group.md).
Inside a group the button becomes controlled: it stops flipping itself and stops
emitting, and the group drives it.

## Variants

| Variant     | Resting                                    |
| ----------- | ------------------------------------------ |
| `primary`   | Raised surface; solid indigo when pressed  |
| `secondary` | Flat; soft indigo tint when pressed        |
| `outline`   | Bordered, transparent; tinted when pressed |

## API

| Property       | Attribute       | Type                                    | Default     |
| -------------- | --------------- | --------------------------------------- | ----------- |
| `selected`     | `selected`      | `boolean`                               | `false`     |
| `disabled`     | `disabled`      | `boolean`                               | `false`     |
| `variant`      | `variant`       | `'primary' \| 'secondary' \| 'outline'` | `'primary'` |
| `size`         | `size`          | `'small' \| 'medium' \| 'large'`        | `'medium'`  |
| `value`        | `value`         | `string`                                | `''`        |
| `icon`         | `icon`          | `string`                                | `''`        |
| `iconPosition` | `icon-position` | `'left' \| 'right'`                     | `'left'`    |
| `label`        | `label`         | `string`                                | `''`        |

| Event       | Detail                                           |
| ----------- | ------------------------------------------------ |
| `kt-change` | `{ selected, value }` — not fired inside a group |

| Slot      | Description      |
| --------- | ---------------- |
| _default_ | The button label |

| Part     | Description           |
| -------- | --------------------- |
| `button` | The native `<button>` |
