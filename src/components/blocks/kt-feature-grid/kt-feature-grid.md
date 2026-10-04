# `<kt-feature-grid>`

What the product does, a feature at a time: an icon, a title and a line, in a
grid.

```html
<kt-feature-grid
  id="why"
  heading="Why teams switch"
  lead="Less chasing, more paid."
></kt-feature-grid>
<script>
  why.features = [
    { icon: 'send', title: 'Sent in a second', description: 'From the quote, in one click.' },
    { icon: 'refresh-cw', title: 'Chased for you', description: 'Polite reminders, on schedule.' },
    { icon: 'check', title: 'Reconciled', description: 'Matched to the bank.', href: '/bank' },
  ];
</script>
```

## Features

| Field         | What it is                                                       |
| ------------- | ---------------------------------------------------------------- |
| `title`       | The feature's name.                                              |
| `description` | A line on what it does for the reader.                           |
| `icon`        | Optional: an icon's name, in a tinted square.                    |
| `href`        | Optional: makes the title a link — the whole feature answers it. |

## Layout

`columns` sets how many features per row — 2, 3 (the default) or 4 — where
there is room: under 760px the grid has two columns at most, under 480px one.
It follows the grid's own width. `variant="card"` puts each feature on a
card.

## Accessibility

A section named by its heading, an `<h2>` by default (`heading-level`). The
features are a list; each title sits one level under the heading. Icons are
decoration and hidden from assistive tech.

## API

| Property       | Attribute       | Type                  | Default    |
| -------------- | --------------- | --------------------- | ---------- |
| `heading`      | `heading`       | `string`              | `''`       |
| `lead`         | `lead`          | `string`              | `''`       |
| `features`     | —               | `KtFeature[]`         | `[]`       |
| `columns`      | `columns`       | `2 \| 3 \| 4`         | `3`        |
| `variant`      | `variant`       | `'plain' \| 'card'`   | `'plain'`  |
| `align`        | `align`         | `'center' \| 'start'` | `'center'` |
| `headingLevel` | `heading-level` | `number`              | `2`        |
