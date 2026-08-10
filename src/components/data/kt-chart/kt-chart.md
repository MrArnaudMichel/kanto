# `<kt-chart>`

A small chart, drawn from the token layer.

```js
chart.labels = ['Jan', 'Feb', 'Mar', 'Apr'];
chart.series = [{ name: 'Revenue', values: [42, 58, 36, 71] }];
chart.format = (n) => `$${n.toLocaleString('en-US')}`;
```

```html
<kt-chart type="area" label="Revenue by month" height="220"></kt-chart>
```

Deliberately narrow: one axis, one to eight series, three marks — `area`,
`line`, `bar`. It is the shape a product dashboard actually needs. Past that you
want a real charting library, and this component will not pretend otherwise.

**One axis, always.** There is no second y-scale and there will not be: two
measures of different magnitude belong in two charts, or indexed to a common
base. A dual-axis chart lets you imply any correlation you like by sliding one
scale.

## Colour

**One series takes the brand hue.** With nothing to tell apart there is no
identity to encode, and the title names it — so a lone series needs no legend
either, and does not get one.

**Two or more take the fixed categorical order** in `--chart-series-1…8`,
assigned by position and never cycled. A ninth series is not a generated
hue — fold it into "Other", or facet.

Those eight hues are kept clear of the semantic palette, so a line can never be
mistaken for a status. They are validated against Kanto's own card surface in
both themes: worst adjacent CVD ΔE 8.4, worst adjacent normal-vision ΔE 19.3.

**Colour follows the entity, not the rank.** If a filter removes a series, pass
`color` on the survivors so they keep the hue the reader learned:

```js
chart.series = [{ name: 'Orders', values, color: 'var(--chart-series-2)' }];
```

## The table is not optional

Every chart also renders its data as a `<table>`, visually hidden and pointed at
by the plot's `aria-describedby`. It is what a screen reader reads, and it is
the relief that four of the light-theme series hues require — they sit below
3:1 on a light surface, which is legal only with a text alternative.

`show-table` puts it on screen, which is often the right call in a report.

## Hover

Line and area charts get a crosshair and a tooltip; bars dim the groups you are
not pointing at. `kt-point-hover` reports the index, so a caption or a figure
elsewhere on the page can follow the pointer.

## Smoothing is off

`smooth` interpolates with a monotone cubic — one that never overshoots the
samples, unlike the cardinal spline most charts reach for, which invents peaks
that are not in the data.

It is still off by default, because a curve between two samples draws values
nobody measured. Turn it on when the underlying quantity really is continuous
and the reader knows it.

## API

| Property    | Attribute    | Type                        | Default  |
| ----------- | ------------ | --------------------------- | -------- |
| `type`      | `type`       | `'area' \| 'line' \| 'bar'` | `'area'` |
| `series`    | —            | `KtSeries[]`                | `[]`     |
| `labels`    | —            | `string[]`                  | `[]`     |
| `height`    | `height`     | `number`                    | `200`    |
| `format`    | —            | `(value: number) => string` | `String` |
| `noGrid`    | `no-grid`    | `boolean`                   | `false`  |
| `showTable` | `show-table` | `boolean`                   | `false`  |
| `smooth`    | `smooth`     | `boolean`                   | `false`  |
| `label`     | `label`      | `string`                    | `''`     |

```ts
interface KtSeries {
  name: string;
  values: number[];
  color?: string; // overrides the categorical slot
}
```

| Event            | Detail                                             |
| ---------------- | -------------------------------------------------- |
| `kt-point-hover` | `{ index: number }` — `-1` when the pointer leaves |

| Part     | Description                    |
| -------- | ------------------------------ |
| `svg`    | The plot                       |
| `legend` | The legend, from two series up |
| `table`  | The data table                 |
