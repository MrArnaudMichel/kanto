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

Text sorts through `Intl.Collator('fr', { numeric: true })`, so "Ångström" files
next to "Elan" rather than after "Zeta", and "Entity 2" comes before
"Entity 10". Empty values sort to the end whichever way the column points — a
descending sort should not open with a screen of blanks.

`aria-sort` on the header reflects the state.

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
    ? html`<kt-chip variant="category" color="var(--color-success-base)">${row.status}</kt-chip>`
    : undefined;
```

## API

| Property        | Attribute        | Type                       | Default                |
| --------------- | ---------------- | -------------------------- | ---------------------- |
| `columns`       | —                | `KtTableColumn[]`          | `[]`                   |
| `data`          | —                | `KtTableRow[]`             | `[]`                   |
| `selectable`    | `selectable`     | `boolean`                  | `false`                |
| `selectionMode` | `selection-mode` | `'single' \| 'multiple'`   | `'multiple'`           |
| `selected`      | —                | `unknown[]`                | `[]`                   |
| `pageSize`      | `page-size`      | `number` (0 = no paging)   | `0`                    |
| `loading`       | `loading`        | `boolean`                  | `false`                |
| `compact`       | `compact`        | `boolean`                  | `false`                |
| `sortKey`       | `sort-key`       | `string \| null`           | `null`                 |
| `sortDirection` | `sort-direction` | `'asc' \| 'desc' \| null`  | `null`                 |
| `renderCell`    | —                | `(row, column) => unknown` | —                      |
| `emptyText`     | `empty-text`     | `string`                   | `'No data to display'` |
| `loadingText`   | `loading-text`   | `string`                   | `'Loading…'`           |
| `label`         | `label`          | `string`                   | `''`                   |

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
