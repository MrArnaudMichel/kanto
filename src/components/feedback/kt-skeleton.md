# `<kt-skeleton>`

A loading placeholder, pulsing between `--surface-raised` and `--surface-hover`
— the same elevation ramp everything else in Kanto uses, so it reads as part of
the page rather than as a grey rectangle pasted onto it.

```html
<kt-skeleton count="3"></kt-skeleton>
<kt-skeleton variant="circle" width="48px" height="48px"></kt-skeleton>
<kt-skeleton variant="rect" height="180px"></kt-skeleton>
```

With `count` above one the last line is drawn at 60% width, which is the shape a
paragraph actually has. Without it, a skeleton reads as stacked bars rather than
as text.

## Accessibility

The element sets `aria-hidden` on itself: it is a picture of content that is not
there yet, and reading out a dozen empty boxes is worse than silence.

Announce the loading state on the region that owns it:

```html
<section aria-busy="true">
  <kt-skeleton count="4"></kt-skeleton>
</section>
```

The pulse stops under `prefers-reduced-motion`.

## API

| Property   | Attribute  | Type                           | Default  |
| ---------- | ---------- | ------------------------------ | -------- |
| `variant`  | `variant`  | `'text' \| 'rect' \| 'circle'` | `'text'` |
| `width`    | `width`    | `string` (any CSS length)      | `''`     |
| `height`   | `height`   | `string`                       | `''`     |
| `count`    | `count`    | `number`                       | `1`      |
| `animated` | `animated` | `boolean`                      | `true`   |

Defaults per variant: text 100% × 14px, rect 100% × 80px, circle 40 × 40px.

| Part   | Description          |
| ------ | -------------------- |
| `line` | One placeholder line |
