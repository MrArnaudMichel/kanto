# `<kt-slider>`

A value picked by sliding along a range: a volume, a threshold, or with `range`, a price between two ends.

```html
<kt-slider label="Volume" value="40" show-value></kt-slider>
<kt-slider label="Price" range min="0" max="500" step="10" value="50/300" show-value></kt-slider>
```

## Native underneath

Each thumb is a native `<input type="range">`, laid over a track Kanto draws.
The keyboard comes from the platform — arrows and Page Up/Down step, Home and
End go to the bounds — and so does what a screen reader announces. A `range`
lays two inputs over one track; each thumb catches its own pointer.

## The value

The value is text, as a form field's is: `"40"`, or with `range`, `"20/80"` —
low, then high. It is kept within `min` and `max` and on `step`: `value="42"`
with `step="5"` reads `40`. Without a value, a slider starts at `min`, and a
range at its two bounds. The two thumbs of a range never cross: the low end
stops at the high one.

`kt-input` fires while sliding, `kt-change` once the thumb is let go — the one
to save on.

## Showing the value

`show-value` puts the label and the current value above the slider. `format`
says how a number reads, there and to a screen reader:

```js
slider.format = (n) => `$${n.toLocaleString('en-US')}`;
```

## In a form

A form control: it submits its value under `name` — `"20/80"` for a range —
and `form.reset()` puts back the first value. A disabled fieldset disables it.

## API

| Property    | Attribute    | Type                    | Default     |
| ----------- | ------------ | ----------------------- | ----------- |
| `value`     | `value`      | `string`                | `min`       |
| `min`       | `min`        | `number`                | `0`         |
| `max`       | `max`        | `number`                | `100`       |
| `step`      | `step`       | `number`                | `1`         |
| `range`     | `range`      | `boolean`               | `false`     |
| `label`     | `label`      | `string`                | `''`        |
| `name`      | `name`       | `string`                | `''`        |
| `showValue` | `show-value` | `boolean`               | `false`     |
| `format`    | —            | `(n: number) => string` | `String(n)` |
| `disabled`  | `disabled`   | `boolean`               | `false`     |

| Event       | Detail              |
| ----------- | ------------------- |
| `kt-input`  | `{ value: string }` |
| `kt-change` | `{ value: string }` |

| Part    | Description                        |
| ------- | ---------------------------------- |
| `track` | The rail                           |
| `fill`  | The selected stretch of it         |
| `value` | The shown value, with `show-value` |

| Property            | Description          | Default |
| ------------------- | -------------------- | ------- |
| `--kt-slider-thumb` | The thumb's diameter | `18px`  |
| `--kt-slider-track` | The rail's thickness | `6px`   |

## Accessibility

Each thumb is a native slider named by `label` — "Price, minimum" and "Price,
maximum" for a range — announcing its value through `format`.
