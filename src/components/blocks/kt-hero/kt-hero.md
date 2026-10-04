# `<kt-hero>`

The top of a page: what the product is, in a heading and a line, and the way
in.

```html
<kt-hero heading="Invoices that pay themselves" lead="Send, chase and reconcile, in one place.">
  <a slot="announcement" href="/changelog">New: recurring invoices</a>
  <kt-button slot="actions" size="large">Start free</kt-button>
  <kt-button slot="actions" size="large" variant="secondary">Book a demo</kt-button>
  <span slot="note">Free for three months. No card needed.</span>
  <img slot="media" src="/screenshot.png" alt="The invoices screen" />
</kt-hero>
```

## Layout

| `layout`  | What it does                                                              |
| --------- | ------------------------------------------------------------------------- |
| `stacked` | The default: the media under the words — a screenshot, a live demo.       |
| `split`   | The media beside the words once the hero is 880px wide; under them below. |

`align` centres the words — the default — or keeps them at the `start`. The
layout follows the hero's own width, so it holds in a preview as on a page.
An empty slot takes no room.

## Slots

| Slot           | Where                                                 |
| -------------- | ----------------------------------------------------- |
| `announcement` | Above the heading: what is new, as a link or a badge. |
| `actions`      | Under the lead: the buttons.                          |
| `note`         | Under the actions: what it costs, what it needs.      |
| `media`        | A screenshot, an illustration, a live demo.           |

## Accessibility

A section named by its heading — an `<h1>`, since a hero opens its page;
`heading-level` changes it. An image in `media` needs its own `alt`.

## API

| Property       | Attribute       | Type                   | Default     |
| -------------- | --------------- | ---------------------- | ----------- |
| `heading`      | `heading`       | `string`               | `''`        |
| `lead`         | `lead`          | `string`               | `''`        |
| `align`        | `align`         | `'center' \| 'start'`  | `'center'`  |
| `layout`       | `layout`        | `'stacked' \| 'split'` | `'stacked'` |
| `headingLevel` | `heading-level` | `number`               | `1`         |

| CSS property         | What it sets                                |
| -------------------- | ------------------------------------------- |
| `--kt-block-padding` | The room above and below, as in every block |
