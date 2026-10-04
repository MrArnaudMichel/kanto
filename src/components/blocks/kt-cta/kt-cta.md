# `<kt-cta>`

The ask at the end of a page: a heading, a line, and the button that acts on
them.

```html
<kt-cta heading="Start sending invoices" lead="Your first invoice goes out in two minutes.">
  <kt-button slot="actions" size="large">Start free</kt-button>
  <kt-button slot="actions" size="large" variant="secondary">Talk to sales</kt-button>
  <span slot="note">Free for three months. No card needed.</span>
</kt-cta>
```

## Variants and layout

| `variant` | What it does                                          |
| --------- | ----------------------------------------------------- |
| `panel`   | The default: on a tinted panel, the page's last word. |
| `plain`   | On the page, for a call to action between sections.   |

`stacked`, the default layout, puts the actions under the words; `inline`
sets them at the end, beside the words, once the block is 720px wide — under
them below. `align` centres the words, the default, or keeps them at the
`start`. An empty slot takes no room.

## Accessibility

A section named by its heading, an `<h2>` by default (`heading-level`). Say
what the button does — Start free, not Click here.

## API

| Property       | Attribute       | Type                    | Default     |
| -------------- | --------------- | ----------------------- | ----------- |
| `heading`      | `heading`       | `string`                | `''`        |
| `lead`         | `lead`          | `string`                | `''`        |
| `variant`      | `variant`       | `'panel' \| 'plain'`    | `'panel'`   |
| `layout`       | `layout`        | `'stacked' \| 'inline'` | `'stacked'` |
| `align`        | `align`         | `'center' \| 'start'`   | `'center'`  |
| `headingLevel` | `heading-level` | `number`                | `2`         |

| Slot      | What goes in it                           |
| --------- | ----------------------------------------- |
| `actions` | The buttons.                              |
| `note`    | Under them: what it costs, what it needs. |
