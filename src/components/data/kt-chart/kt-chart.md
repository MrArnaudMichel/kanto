# `<kt-chart>`

A chart, drawn from the token layer: line, area and bar — stacked, sideways or
mixed — plus scatter, bubble, pie, doughnut, polar area and radar.

```js
chart.labels = ['Jan', 'Feb', 'Mar', 'Apr'];
chart.series = [{ name: 'Revenue', values: [42, 58, 36, 71] }];
chart.format = (n) => `$${n.toLocaleString('en-US')}`;
```

```html
<kt-chart type="area" label="Revenue by month" height="220"></kt-chart>
```

Every type shares one data model, one tooltip, one legend and one keyboard
model, so learning one chart is learning all of them.

## Choosing a type

| Type                 | Use it for                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------ |
| `line`               | A measure over time, where the shape of the change is the point                            |
| `area`               | The same, when the size under the line matters — or, `stacked`, parts of a total over time |
| `bar`                | Comparing categories                                                                       |
| `bar` + `horizontal` | Long category names, or a ranking read top to bottom                                       |
| `bar` + `stacked`    | A total per category, split into parts                                                     |
| mixed                | A measure in bars against a target or average as a line                                    |
| `scatter`            | Whether two measures move together                                                         |
| `bubble`             | The same, with a third measure as size                                                     |
| `pie`                | A few parts of one whole — past five slices, use a bar                                     |
| `doughnut`           | A pie with the total in the middle                                                         |
| `polar-area`         | Cyclic categories compared by size                                                         |
| `radar`              | A profile across several measures on the same scale                                        |

## The rules it keeps

**One value axis, always.** There is no second y-scale and there will not be:
two measures of different magnitude belong in two charts, or indexed to a common
base. A dual-axis chart lets you imply any correlation you like by sliding one
scale.

**Bars and areas start at zero.** Their size is their distance from zero, so a
bar axis that starts at 40 makes 50 look twice 45. Lines follow their data,
because a line is read by its shape. `min` and `max` override both — use them
knowingly.

**Area carries the value.** A bubble twice the value is twice the area, not
twice the radius, and a polar slice's radius is the square root of its value.
Anything else overstates the big ones.

**Slices are one distribution.** Pie, doughnut and polar area read `labels` as
the slices and the **first series** as their values. Comparing two
distributions is a stacked bar's job, not two pies'. Negative values are drawn
as nothing and kept, as written, in the table.

## Colour

**One series takes the brand hue.** With nothing to tell apart there is no
identity to encode, and the title names it — so a lone series needs no legend
either, and does not get one.

**Two or more take the fixed categorical order** in `--chart-series-1…8`,
assigned by position and never cycled. A ninth series is not a generated hue —
fold it into "Other", or facet. Slices take the same order, by slice.

Those eight hues are kept clear of the semantic palette, so a line can never be
mistaken for a status. They are validated against Kanto's own card surface in
both themes: worst adjacent CVD ΔE 8.4, worst adjacent normal-vision ΔE 19.3.

**Colour follows the entity, not the rank.** Hiding a series from the legend
never repaints the others. If a filter removes one from the data, pass `color`
on the survivors so they keep the hue the reader learned:

```js
chart.series = [{ name: 'Orders', values, color: 'var(--chart-series-2)' }];
```

Separators — the gap between slices, the ring around a dot — are drawn in
`--surface-card`. Put the chart on a card surface and they read as the surface
showing through.

## Stacked, sideways and mixed

```html
<kt-chart type="bar" stacked></kt-chart>

<kt-chart type="bar" horizontal></kt-chart>
```

`stacked` piles bars on bars and areas on areas; lines never stack. The tooltip
adds a total, and so does the table.

A series can be drawn as another mark with its own `type`. Lines are then placed
at the centre of each bar's band and drawn above the bars:

```js
chart.type = 'bar';
chart.series = [
  { name: 'Signups', values: [320, 410, 380] },
  { name: 'Target', values: [400, 420, 440], type: 'line' },
];
```

`horizontal` applies only when every visible series is a bar.

## Scatter and bubble

These take `points` instead of `values`, and no `labels`:

```js
chart.type = 'bubble';
chart.series = [
  {
    name: 'Markets',
    points: [
      { x: 4, y: 18, r: 120, label: 'France' },
      { x: 9, y: 24, r: 64, label: 'Germany' },
    ],
  },
];
chart.format = (n) => `${n}%`; // y
chart.formatX = (n) => `${n}%`; // x
```

Neither axis is forced through zero: a scatter plot is about how two measures
move together, and dragging the origin in crushes the cloud into a corner. A
`label` names the point in the tooltip and the table.

## Hover and keyboard

The tooltip follows the pointer on every type: a whole category on line, area
and bar charts, the nearest point on scatter and bubble, a slice or a spoke on
radial charts. It opens above the mark, or beside it when there is no room —
never on top of what it describes.

The plot is focusable. **Arrow keys** walk the categories, slices or spokes;
on scatter and bubble, left and right walk the current series in x order and up
and down move between series. **Home** and **End** jump to the ends,
**Escape** lets go. The tooltip is a live region, so a keyboard move is
announced.

`kt-point-hover` reports every change, so a caption or a figure elsewhere on the
page can follow along.

## The legend

It appears from two series up, and always for pie, doughnut and polar area,
whose slices need names. Each item is a toggle: pressing it hides the series or
slice and rescales the chart around what is left. `kt-series-toggle` is
cancelable, for a host that wants to decide. New data resets the legend.

## The table is not optional

Every chart also renders its data as a `<table>`, visually hidden and pointed at
by the plot's `aria-describedby`. It is what a screen reader reads, and it is
the relief that four of the light-theme series hues require — they sit below 3:1
on a light surface, which is legal only with a text alternative.

`show-table` puts it on screen, which is often the right call in a report.

## Smoothing is off

`smooth` draws lines and areas through a monotone cubic — one that never
overshoots the samples, unlike the cardinal spline most charts reach for, which
invents peaks that are not in the data.

It is still off by default, because a curve between two samples draws values
nobody measured. Turn it on when the underlying quantity really is continuous
and the reader knows it. A radar is always drawn straight: a closed curve has no
monotone version.

## Motion

Marks enter once, when they first appear: bars grow from the baseline, lines
draw along their length, everything else fades in. Nothing moves on hover.
The token layer's reduced-motion block turns the entrance off.

## API

| Property      | Attribute      | Type                        | Default   |
| ------------- | -------------- | --------------------------- | --------- |
| `type`        | `type`         | `KtChartType`               | `'area'`  |
| `series`      | —              | `KtSeries[]`                | `[]`      |
| `labels`      | —              | `string[]`                  | `[]`      |
| `height`      | `height`       | `number`                    | `200`     |
| `format`      | —              | `(value: number) => string` | `String`  |
| `formatX`     | —              | `(value: number) => string` | `String`  |
| `stacked`     | `stacked`      | `boolean`                   | `false`   |
| `horizontal`  | `horizontal`   | `boolean`                   | `false`   |
| `smooth`      | `smooth`       | `boolean`                   | `false`   |
| `min`         | `min`          | `number \| null`            | `null`    |
| `max`         | `max`          | `number \| null`            | `null`    |
| `noGrid`      | `no-grid`      | `boolean`                   | `false`   |
| `noAxis`      | `no-axis`      | `boolean`                   | `false`   |
| `showTable`   | `show-table`   | `boolean`                   | `false`   |
| `centerLabel` | `center-label` | `string`                    | `'Total'` |
| `totalLabel`  | `total-label`  | `string`                    | `'Total'` |
| `label`       | `label`        | `string`                    | `''`      |

```ts
type KtChartType =
  'line' | 'area' | 'bar' | 'scatter' | 'bubble' | 'pie' | 'doughnut' | 'polar-area' | 'radar';

interface KtSeries {
  name: string;
  values?: number[]; // one per label
  points?: KtPoint[]; // scatter and bubble
  color?: string; // pins the hue
  type?: 'line' | 'area' | 'bar'; // mixed charts
}

interface KtPoint {
  x: number;
  y: number;
  r?: number; // bubble size, as a value
  label?: string;
}
```

| Event              | Detail                                                                                               |
| ------------------ | ---------------------------------------------------------------------------------------------------- |
| `kt-point-hover`   | `{ index, series }` — `index` −1 when nothing is active; `series` −1 unless scatter or bubble        |
| `kt-series-toggle` | `{ series, hidden }` — a series index, or a slice index for pie, doughnut and polar area. Cancelable |

| Part     | Description    |
| -------- | -------------- |
| `svg`    | The plot       |
| `legend` | The legend     |
| `table`  | The data table |
