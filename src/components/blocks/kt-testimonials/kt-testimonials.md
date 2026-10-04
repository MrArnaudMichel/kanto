# `<kt-testimonials>`

What the people who use it say: a quote, and who said it.

```html
<kt-testimonials id="wall" heading="What teams say"></kt-testimonials>
<script>
  wall.testimonials = [
    {
      quote: 'We closed the month in a day.',
      name: 'Ada Park',
      role: 'CFO, Northwind',
      avatar: '/ada.jpg',
    },
    { quote: 'Reminders I never have to write.', name: 'Sam Ortiz', role: 'Founder, Ortiz Studio' },
  ];
</script>
```

## Testimonials

| Field    | What it is                                                     |
| -------- | -------------------------------------------------------------- |
| `quote`  | What they said, without quotation marks — the block adds them. |
| `name`   | Who said it.                                                   |
| `role`   | Optional: their role and company.                              |
| `avatar` | Optional: a photo's URL; without one, their initials.          |

## Layout

`grid`, the default, sets the quotes in columns that pack quotes of any length
— three where there is room, one on a phone. `single` gives each the page's
width, in larger type and on no card: for the one quote that carries a
section.

## Accessibility

A section named by its heading, an `<h2>` by default (`heading-level`). Each
quote is a `<figure>`: the words in a `<blockquote>`, who said them in its
`<figcaption>`. The avatar repeats the name, so it is hidden from assistive
tech.

## API

| Property       | Attribute       | Type                  | Default    |
| -------------- | --------------- | --------------------- | ---------- |
| `heading`      | `heading`       | `string`              | `''`       |
| `lead`         | `lead`          | `string`              | `''`       |
| `testimonials` | —               | `KtTestimonial[]`     | `[]`       |
| `layout`       | `layout`        | `'grid' \| 'single'`  | `'grid'`   |
| `align`        | `align`         | `'center' \| 'start'` | `'center'` |
| `headingLevel` | `heading-level` | `number`              | `2`        |
