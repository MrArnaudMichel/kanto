# `<kt-table>`

A data table: tri-state sorting, single or multiple selection, paging.

```js
table.columns = [
  { key: 'name', label: 'Nom', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true, align: 'right' },
  { key: 'status', label: 'Status' },
];
table.data = rows;
table.pageSize = 20;
```

## Sorting

Sortable headers are **buttons**, not clickable `<th>`s. A header you can only
sort with a mouse is a table half the users cannot sort.

Each press cycles: unsorted → ascending → descending → unsorted. The third press
restoring the original order is what makes sorting undoable.

Text sorts through `Intl.Collator` with `numeric: true`, in the table's
`locale`, else the page's `<html lang>`, else the browser's language. Each
language files accents its own way — "Ångström" next to "Angstrom" in English,
after "Zeta" in Swedish — and "Entity 2" comes before "Entity 10". Empty values sort to the end whichever way the column points — a
descending sort should not open with a screen of blanks.

`aria-sort` on the header reflects the state.

The rows are sorted once per change of `data` or of the order, not on every
render, so hovering and selecting stay quick on a few thousand rows. That relies
on `data` being replaced, not edited: assign a new array
(`table.data = [...rows, added]`) rather than pushing into the old one.

## Server-side data

With `manual`, the table sorts and pages nothing itself: `data` is the page the
server sent, shown as it is, and `total-rows` is how many rows the server holds,
which the pager counts from. Headers and the pager still update `sortKey`,
`sortDirection` and `page` and fire their events; the application loads what
they ask for.

```js
table.manual = true;
table.pageSize = 25;

async function load() {
  table.loading = true;
  const { rows, total } = await api.customers({
    page: table.page,
    size: table.pageSize,
    sort: table.sortKey,
    direction: table.sortDirection,
  });
  table.data = rows;
  table.totalRows = total;
  table.loading = false;
}

table.addEventListener('kt-sort-change', load);
table.addEventListener('kt-page-change', load);
load();
```

A new sort sends `page` back to 1 and fires only `kt-sort-change` — one event,
one reload. While `loading`, a table that already shows a page keeps it on
screen, dimmed and `aria-busy`, so the pager that asked for the next one keeps
its place and its focus; the loading message only replaces the table before
anything has loaded.

Selection is kept by row identity, so it survives paging. `selectedRows` can
only return the selected rows of the page on screen: keep the rows themselves
on your side if you need them across pages.

## Selection

```html
<kt-table selectable selection-mode="multiple"></kt-table>
```

Rows are identified by `id`, then `uid`, then the row object itself. `selected`
holds those identities; `selectedRows` gives you the rows.

Multiple mode adds a select-all box in the header, which goes indeterminate on
a partial selection.

```js
table.addEventListener('kt-selection-change', (e) => {
  console.log(e.detail.selected, e.detail.rows);
});
```

## Custom cells

`renderCell` returns anything Lit can render — or `undefined` to fall back to
the raw value, so it only has to handle the columns it cares about.

```js
table.renderCell = (row, column) =>
  column.key === 'status'
    ? html`<kt-badge variant="category" color="var(--color-success-base)">${row.status}</kt-badge>`
    : undefined;
```

## API

| Property        | Attribute        | Type                       | Default                   |
| --------------- | ---------------- | -------------------------- | ------------------------- |
| `columns`       | —                | `KtTableColumn[]`          | `[]`                      |
| `data`          | —                | `KtTableRow[]`             | `[]`                      |
| `selectable`    | `selectable`     | `boolean`                  | `false`                   |
| `selectionMode` | `selection-mode` | `'single' \| 'multiple'`   | `'multiple'`              |
| `selected`      | —                | `unknown[]`                | `[]`                      |
| `pageSize`      | `page-size`      | `number` (0 = no paging)   | `0`                       |
| `page`          | `page`           | `number`, from 1           | `1`                       |
| `manual`        | `manual`         | `boolean`                  | `false`                   |
| `totalRows`     | `total-rows`     | `number` (manual mode)     | `0`                       |
| `loading`       | `loading`        | `boolean`                  | `false`                   |
| `compact`       | `compact`        | `boolean`                  | `false`                   |
| `sortKey`       | `sort-key`       | `string \| null`           | `null`                    |
| `sortDirection` | `sort-direction` | `'asc' \| 'desc' \| null`  | `null`                    |
| `renderCell`    | —                | `(row, column) => unknown` | —                         |
| `emptyText`     | `empty-text`     | `string`                   | `'No data to display'`    |
| `loadingText`   | `loading-text`   | `string`                   | `'Loading…'`              |
| `label`         | `label`          | `string`                   | `''`                      |
| `locale`        | `locale`         | `string` (BCP 47)          | `''` (page, then browser) |

```ts
interface KtTableColumn {
  key: string;
  label?: string; // falls back to key
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
}
```

| Getter         | Returns                         |
| -------------- | ------------------------------- |
| `sortedRows`   | All rows, sorted, before paging |
| `visibleRows`  | The rows currently on screen    |
| `selectedRows` | The selected rows themselves    |
| `totalPages`   | Page count                      |

| Event                 | Detail               |
| --------------------- | -------------------- |
| `kt-sort-change`      | `{ key, direction }` |
| `kt-selection-change` | `{ selected, rows }` |
| `kt-row-click`        | `{ row, index }`     |
| `kt-page-change`      | `{ page }`           |

| Part          | Description   |
| ------------- | ------------- |
| `table`       | The `<table>` |
| `header-cell` | A `<th>`      |
| `row`         | A `<tr>`      |
| `cell`        | A `<td>`      |
