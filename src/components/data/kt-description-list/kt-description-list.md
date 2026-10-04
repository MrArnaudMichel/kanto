# `<kt-description-list>`

Terms and their details — an invoice's number, customer and amount; a person's
email and role — the body of a detail page.

```html
<kt-description-list label="Invoice" bordered></kt-description-list>

<script>
  document.querySelector('kt-description-list').items = [
    { term: 'Invoice', detail: 'INV-2041' },
    { term: 'Customer', detail: 'Acme Corp' },
    { term: 'Amount', detail: '$1,200' },
    { term: 'Purchase order', detail: '' },
  ];
</script>
```

## Items

`items` is a list of `{ term, detail }`, drawn as a real `<dl>`: each term and
its detail grouped in a `<div>`, as the HTML specification allows. An empty
detail shows a dash, so a missing value reads as missing rather than as a gap
someone forgot to fill.

## Layout

| `layout`     | What it is                                                                                |
| ------------ | ----------------------------------------------------------------------------------------- |
| `horizontal` | The default: each term beside its detail, in a column `--kt-description-term-width` wide. |
| `stacked`    | Each term over its detail; `columns` (1–4) sets them side by side.                        |

Both follow the list's **own width**: below 480px a horizontal list stacks and
a stacked one drops to a single column, in a narrow panel as on a phone.
`bordered` draws a rule under each item.

## Accessibility

A description list is announced as such, with the number of its items; name it
with `label` when the page has more than one. Terms are muted and details full
strength, so the eye reads the values while a screen reader reads both.

## API

| Property   | Attribute  | Type                        | Default        |
| ---------- | ---------- | --------------------------- | -------------- |
| `items`    | —          | `KtDescriptionItem[]`       | `[]`           |
| `layout`   | `layout`   | `'horizontal' \| 'stacked'` | `'horizontal'` |
| `columns`  | `columns`  | `number` (1–4)              | `1`            |
| `bordered` | `bordered` | `boolean`                   | `false`        |
| `label`    | `label`    | `string`                    | `''`           |

| Part     | Description             |
| -------- | ----------------------- |
| `list`   | The `<dl>`              |
| `item`   | One term and its detail |
| `term`   | The `<dt>`              |
| `detail` | The `<dd>`              |
