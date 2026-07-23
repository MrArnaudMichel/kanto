# `<kt-progress-bar>`

A determinate progress bar.

```html
<kt-progress-bar value="64" show-value label="Importing entities"></kt-progress-bar>
<kt-progress-bar value="90" variant="warning" striped animated></kt-progress-bar>
<kt-progress-bar value="4" max="7" size="small"></kt-progress-bar>
```

Reaching `max` switches the fill to the success colour whatever the variant, so
"done" reads at a glance without the caller swapping anything.

Out-of-range values are clamped and a `max` of zero is treated as 100 — a
progress bar should never be the thing that puts `NaN%` on screen.

## Stripes

The animated stripe is the one decorative animation in Kanto, and it earns its
place: it is how an operation says it is still working when the number is not
moving. It needs both `striped` and `animated`, and it stops under
`prefers-reduced-motion`.

## Accessibility

`role="progressbar"` with `aria-valuenow`/`aria-valuemax`, plus an
`aria-valuetext` of `"64 %"` so it is read as a percentage rather than a bare
number. Give it a `label` saying _what_ is progressing.

## API

| Property    | Attribute    | Type                                                                     | Default     |
| ----------- | ------------ | ------------------------------------------------------------------------ | ----------- |
| `value`     | `value`      | `number`                                                                 | `0`         |
| `max`       | `max`        | `number`                                                                 | `100`       |
| `size`      | `size`       | `'small' \| 'medium' \| 'large'`                                         | `'medium'`  |
| `variant`   | `variant`    | `'primary' \| 'info' \| 'success' \| 'warning' \| 'danger' \| 'neutral'` | `'primary'` |
| `showValue` | `show-value` | `boolean`                                                                | `false`     |
| `striped`   | `striped`    | `boolean`                                                                | `false`     |
| `animated`  | `animated`   | `boolean`                                                                | `false`     |
| `label`     | `label`      | `string`                                                                 | `''`        |

| Getter    | Returns                 |
| --------- | ----------------------- |
| `percent` | Whole percentage, 0–100 |

| Part    | Description          |
| ------- | -------------------- |
| `track` | The groove           |
| `fill`  | The filled portion   |
| `label` | The percentage label |
