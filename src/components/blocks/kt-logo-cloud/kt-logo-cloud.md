# `<kt-logo-cloud>`

Who uses it, in their logos: a line of marks under a caption.

```html
<kt-logo-cloud heading="Trusted by finance teams at">
  <img src="/logos/northwind.svg" alt="Northwind" />
  <img src="/logos/kiln.svg" alt="Kiln" />
  <svg role="img" aria-label="Sato Ceramics" viewBox="0 0 120 28">…</svg>
</kt-logo-cloud>
```

## Logos

The logos are the default slot: images or inline SVGs. They are drawn at one
height — `--kt-logo-height`, 28px — and up to 160px wide, grey until hovered,
so no brand shouts over another. `colour` keeps their colours. An inline SVG
drawn in `currentColor` takes the muted text colour.

They wrap onto as many lines as they need, centred, or at the `start` with
`align="start"`.

## Accessibility

A section named by its caption — a heading, an `<h2>` by default
(`heading-level`), set small. Each logo needs its company's name: `alt` on an
image, `role="img"` and `aria-label` on an SVG. A logo that links to a case
study goes in an `<a>` with that name.

## API

| Property       | Attribute       | Type                  | Default    |
| -------------- | --------------- | --------------------- | ---------- |
| `heading`      | `heading`       | `string`              | `''`       |
| `colour`       | `colour`        | `boolean`             | `false`    |
| `align`        | `align`         | `'center' \| 'start'` | `'center'` |
| `headingLevel` | `heading-level` | `number`              | `2`        |

| CSS property       | Default |
| ------------------ | ------- |
| `--kt-logo-height` | `28px`  |
