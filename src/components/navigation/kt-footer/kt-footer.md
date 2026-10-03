# `<kt-footer>`

The site footer: a contentinfo landmark holding the brand and a word about the
product, columns of links, actions, and a legal line under them.

```html
<kt-footer label="Site">
  <a slot="brand" href="/">ACME</a>
  Invoicing for small teams.
  <kt-button slot="actions" size="small" variant="secondary" icon="mail">Contact us</kt-button>
  <span slot="legal">© 2026 Acme. All rights reserved.</span>
</kt-footer>

<script>
  document.querySelector('kt-footer').columns = [
    {
      heading: 'Product',
      links: [
        { label: 'Features', href: '/features' },
        { label: 'Pricing', href: '/pricing' },
      ],
    },
    {
      heading: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'GitHub', href: 'https://github.com/acme', external: true },
      ],
    },
  ];
</script>
```

## Columns

The links are data, set as a property: `columns` is a list of
`{ heading, links }`, and each link is `{ label, href, external? }`. Every
column is laid out, named and marked the same way, so a footer cannot drift
into a mix of styles.

An `external` link — one that leaves the site — gets the external-link icon,
hidden from screen readers, and `rel="noopener"`. It opens where the reader
is, as every other link does.

The headings are `<h2>` by default, since a footer sits under the page's `h1`.
Set `heading-level` to 3–6 when the footer sits deeper in the outline.

## Variants

| `variant` | What it is                                                         |
| --------- | ------------------------------------------------------------------ |
| `columns` | The default: the brand on one side, a column per heading opposite. |
| `simple`  | One row: the brand, then every link run together. No headings.     |

`simple` is for a page that needs a footer rather than a site map: an app's
settings, a sign-in screen, a single-page product.

## Slots

| Slot      | Where                                                                         |
| --------- | ----------------------------------------------------------------------------- |
| `brand`   | Logo or wordmark.                                                             |
| _default_ | A word under the brand: what the product is. Hidden in `simple`.              |
| `actions` | Under it: social links, a newsletter form, a contact button.                  |
| `legal`   | The bottom line — copyright, terms, privacy. Its row is left out while empty. |

## Layout

The footer lays itself out from **its own width**, not the viewport's: side by
side once it is 720px wide, stacked below that — in a narrow panel as on a
phone. `--kt-footer-max-width` keeps the content to a column on a wide page
while the background and the rule run edge to edge.

```css
kt-footer {
  --kt-footer-max-width: 1200px;
}
```

Set `--kt-footer-padding-inline: 0` to line the footer up with the content of
a page that already has its own margins.

`bordered`, on by default, draws a rule along the top; turn it off where the
footer sits on a surface of its own.

## Accessibility

A `<footer role="contentinfo">`, named by `label` when the page has more than
one. Put it outside `<main>` — beside it, at the end of the page — since a
contentinfo landmark must not sit inside another. The columns are one `<nav>`
with the same name, a heading over each list. Links keep the theme's focus ring
and read 4.5:1 in both themes.

## API

| Property       | Attribute       | Type                    | Default     |
| -------------- | --------------- | ----------------------- | ----------- |
| `columns`      | —               | `KtFooterColumn[]`      | `[]`        |
| `variant`      | `variant`       | `'columns' \| 'simple'` | `'columns'` |
| `bordered`     | `bordered`      | `boolean`               | `true`      |
| `headingLevel` | `heading-level` | `number` (2–6)          | `2`         |
| `label`        | `label`         | `string`                | `''`        |

| Part      | Description                         |
| --------- | ----------------------------------- |
| `base`    | The `<footer>`                      |
| `brand`   | The brand, its text and the actions |
| `columns` | The navigation holding the columns  |
| `column`  | One column                          |
| `bottom`  | The legal row                       |

| CSS property                 | Default               |
| ---------------------------- | --------------------- |
| `--kt-footer-max-width`      | `none`                |
| `--kt-footer-padding-inline` | `var(--padding-card)` |
