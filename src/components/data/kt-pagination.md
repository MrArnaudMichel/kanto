# `<kt-pagination>`

Previous / next paging, with the position between them.

```html
<kt-pagination page="2" total-pages="7"></kt-pagination>
```

```js
pager.addEventListener('kt-page-change', (e) => load(e.detail.page));
```

`<kt-table>` uses it in its own footer; it is separate so a card list or a
gallery can page the same way a table does.

The page number is `aria-live="polite"`, so a change is announced without
interrupting whatever the reader is already working through. The element clamps
to the range: it will not emit a page below 1 or past `total-pages`.

## API

| Property     | Attribute     | Type     | Default        |
| ------------ | ------------- | -------- | -------------- |
| `page`       | `page`        | `number` | `1`            |
| `totalPages` | `total-pages` | `number` | `1`            |
| `label`      | `label`       | `string` | `'Pagination'` |

| Event            | Detail             |
| ---------------- | ------------------ |
| `kt-page-change` | `{ page: number }` |

| Part       | Description           |
| ---------- | --------------------- |
| `previous` | The previous button   |
| `next`     | The next button       |
| `info`     | The "Page 2 / 7" text |
