# `<kt-meter>`

How a fixed total is spent: storage by file type, a budget by category, seats by
role.

```html
<kt-meter label="Storage" used="25.8 GB used" total="of 983 GB" value="3"></kt-meter>
```

```js
meter.segments = [
  { label: 'Documents', value: 16.14 },
  { label: 'Photos', value: 3.94 },
  { label: 'Other', value: 5.72 },
];
meter.max = 983;
meter.showLegend = true;
meter.format = (n) => `${n} GB`;
```

## Against `<kt-progress-bar>`

A progress bar answers **how far along**: it fills toward completion, and
reaching the end is good news — which is why it turns green there. A meter
answers **how it is divided**: it is full from the moment it renders, and
reaching the end is bad news.

Different question, different component. A bar that shows one and means the
other is a common way to mislead a reader, so the two are not a variant of each
other here.

## Segments and colour

Segments take `--chart-series-N` by position — the same fixed, never-cycled
order the charts use, so a category is the same colour in the meter and in the
chart beside it. Pass `color` to override one. Past eight, fold the tail into
an "Other" segment rather than starting the palette again under a new meaning.

Adjacent fills are separated by a 2px gap of the surface, so two segments of
similar hue still read as two.

Without `max`, segments are measured against their own sum and the bar is full.
With `max`, they are measured against it and the remainder stays empty — which
is what "25.8 GB of 983 GB" means.

## API

| Property     | Attribute     | Type                        | Default         |
| ------------ | ------------- | --------------------------- | --------------- |
| `label`      | `label`       | `string`                    | `''`            |
| `used`       | `used`        | `string`                    | `''`            |
| `total`      | `total`       | `string`                    | `''`            |
| `value`      | `value`       | `number` (0–100)            | `0`             |
| `segments`   | —             | `KtMeterSegment[]`          | `[]`            |
| `max`        | `max`         | `number`                    | `0` (their sum) |
| `showLegend` | `show-legend` | `boolean`                   | `false`         |
| `format`     | —             | `(value: number) => string` | `String`        |

`used` and `total` are free strings rather than numbers, because the caption is
prose — "25.8 GB used", "of 983 GB", "7 of 20 seats" — and formatting it is the
application's job, not the meter's.

```ts
interface KtMeterSegment {
  label: string;
  value: number;
  color?: string;
}
```

| CSS property        | Description      | Default |
| ------------------- | ---------------- | ------- |
| `--kt-meter-height` | The bar's height | `8px`   |

| Part     | Description     |
| -------- | --------------- |
| `base`   | The container   |
| `track`  | The bar         |
| `legend` | The legend list |
