# `<kt-stat>`

One headline figure: a label, a value, and how it moved.

```html
<kt-stat label="Revenue" value="$292,342" delta="-3%" trend="down" icon="dollar-sign"></kt-stat>
<kt-stat label="Customers" value="712" delta="+12%" trend="up" icon="users"></kt-stat>
<kt-stat label="Churn" value="2.1%" delta="-0.4%" trend="down" inverted></kt-stat>
```

## The colour comes from the meaning, not the sign

This is the mistake every dashboard makes. `-3%` on revenue is bad news; `-0.4%`
on churn is good news. The sign is identical.

So `trend` says which way the number went, and `inverted` says that down is the
direction you wanted. The badge takes its colour from the two together — never
from the minus sign.

| `trend` | `inverted` | Badge   |
| ------- | ---------- | ------- |
| `up`    | no         | success |
| `down`  | no         | danger  |
| `up`    | yes        | danger  |
| `down`  | yes        | success |
| `flat`  | either     | neutral |

Leave `trend` off and the badge stays neutral, which is the right default: a
number with no stated direction should not be coloured as though it had one.

## Anatomy

The icon sits on a tinted disc rather than bare — at this size a lone glyph
reads as noise next to the figure. The label is an overline, deliberately
quieter than the number it introduces.

The default slot takes anything that belongs under the value — a sparkline, a
caption, a breakdown.

## API

| Property   | Attribute  | Type                       | Default    |
| ---------- | ---------- | -------------------------- | ---------- |
| `label`    | `label`    | `string`                   | `''`       |
| `value`    | `value`    | `string`                   | `''`       |
| `delta`    | `delta`    | `string`                   | `''`       |
| `trend`    | `trend`    | `'up' \| 'down' \| 'flat'` | `'flat'`   |
| `inverted` | `inverted` | `boolean`                  | `false`    |
| `icon`     | `icon`     | `string`                   | `''`       |
| `caption`  | `caption`  | `string`                   | `''`       |
| `size`     | `size`     | `'small' \| 'medium'`      | `'medium'` |
| `loading`  | `loading`  | `boolean`                  | `false`    |

| Part    | Description |
| ------- | ----------- |
| `base`  | The tile    |
| `value` | The figure  |
