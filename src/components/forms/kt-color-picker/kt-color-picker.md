# `<kt-color-picker>`

A colour, chosen from swatches or set freely: a label's colour, a theme's
accent, a chart series.

```html
<kt-color-picker label="Label colour" name="colour" value="#1f6feb"></kt-color-picker>
```

## Swatches

The swatches are Kanto's accents until `swatches` gives others — a list of
`{ value, label? }`, each a hex colour and the name a screen reader says for it:

```js
picker.swatches = [
  { value: '#e11d48', label: 'Rose' },
  { value: '#f59e0b', label: 'Amber' },
  { value: '#10b981', label: 'Emerald' },
];
```

They are a radio group: a click picks one, the arrows move and pick, wrapping,
and the chosen one wears a ring in its own colour.

## Any colour

Beside the swatches, the free colour: a swatch that opens the system's own
picker, and a hex field that takes a colour once it is a whole one — `#e11d48`,
`e11d48` or `#e14`, all read as `#ee1144`'s spelling, `#rrggbb` in lower case.
The free swatch takes the colour when it is none of the presets.
`no-custom` keeps to the swatches.

## Forms

A form control, submitted as `#rrggbb` under `name`, reset to its first
`value` with the form, disabled with a disabled fieldset. `kt-change` fires as
the colour changes, from a swatch, the picker or the field.

## Accessibility

A radio group named by `label`, each swatch named by its colour's `label` — a
person who cannot tell the swatches apart by sight hears "Blue, radio button,
checked". The system picker and the hex field are named "Custom colour" and
"Hex code", translated through `setStrings` as `customColour` and `hexColour`.

## API

| Property   | Attribute   | Type              | Default         |
| ---------- | ----------- | ----------------- | --------------- |
| `value`    | `value`     | `string`          | `''`            |
| `swatches` | —           | `KtColorSwatch[]` | Kanto's accents |
| `label`    | `label`     | `string`          | `''`            |
| `name`     | `name`      | `string`          | `''`            |
| `disabled` | `disabled`  | `boolean`         | `false`         |
| `noCustom` | `no-custom` | `boolean`         | `false`         |

| Event       | Detail              |
| ----------- | ------------------- |
| `kt-change` | `{ value: string }` |

| Part       | Description              |
| ---------- | ------------------------ |
| `swatches` | The radio group          |
| `swatch`   | One swatch               |
| `custom`   | The free colour's swatch |
| `hex`      | The hex field            |
