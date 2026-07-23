# `<kt-chip>`

A compact label. Three variants, none of them a button by default.

```html
<kt-chip>Active</kt-chip>
<kt-chip variant="code">--color-primary-base</kt-chip>
<kt-chip variant="category" color="#35DD83">Delivered</kt-chip>
<kt-chip error>Failed</kt-chip>
```

| Variant    | Shape           | Use for                                     |
| ---------- | --------------- | ------------------------------------------- |
| `tag`      | 20px pill       | Status and labels. The default.             |
| `code`     | 8px, monospaced | Token names, identifiers, short snippets.   |
| `category` | 8px, tinted     | Taxonomy, where the colour carries meaning. |

## Category colours

`color` takes any CSS colour; the fill is that colour at 20%, via `color-mix`,
and the text and border take it at full strength.

```html
<kt-chip variant="category" color="var(--color-info-base)">Internal</kt-chip>
<kt-chip variant="category" color="rgb(245 171 61)">Priority</kt-chip>
```

Set it in CSS instead when the colour is per-context rather than per-chip:

```css
.overdue kt-chip {
  --kt-chip-color: var(--color-danger-base);
}
```

`error` overrides the palette with the danger colours, whatever the variant.

## Clickable chips

```html
<kt-chip clickable>Filter: region</kt-chip>
```

Adds `role="button"`, a tab stop and Enter/Space activation, then fires
`kt-chip-click`. A chip that only displays state should stay non-clickable —
a tab stop that does nothing is worse than no tab stop.

## API

| Property    | Attribute   | Type                            | Default |
| ----------- | ----------- | ------------------------------- | ------- |
| `variant`   | `variant`   | `'tag' \| 'code' \| 'category'` | `'tag'` |
| `label`     | `label`     | `string`                        | `''`    |
| `color`     | `color`     | `string`                        | `''`    |
| `clickable` | `clickable` | `boolean`                       | `false` |
| `error`     | `error`     | `boolean`                       | `false` |

| Event           | Fired when                       |
| --------------- | -------------------------------- |
| `kt-chip-click` | A `clickable` chip is activated. |

| CSS property      | Description                                       |
| ----------------- | ------------------------------------------------- |
| `--kt-chip-color` | Category hue. Same role as the `color` attribute. |
