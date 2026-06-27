# `<kt-breadcrumb>`

A trail showing where the current page sits.

```js
trail.items = [
  { label: 'Accueil', href: '/' },
  { label: 'Entités', href: '/entites' },
  { label: 'Entité 4812' },
];
```

The last entry is the current page: rendered as text with `aria-current="page"`,
not as a link. A breadcrumb whose final item links to the page you are already
on is a dead control.

## Client-side routing

`kt-navigate` is cancelable. Cancel it and the browser will not follow the
href; leave it alone and the link behaves like a link.

```js
trail.addEventListener('kt-navigate', (e) => {
  e.preventDefault();
  router.push(e.detail.item.href);
});
```

Modified clicks — ⌘, Ctrl, Shift, middle button — are never intercepted. The
user is asking the browser for a new tab, and the element stays out of it.

## API

| Property | Attribute | Type                 | Default          |
| -------- | --------- | -------------------- | ---------------- |
| `items`  | —         | `KtBreadcrumbItem[]` | `[]`             |
| `label`  | `label`   | `string`             | `"Fil d'ariane"` |

```ts
interface KtBreadcrumbItem {
  label: string;
  href?: string;
}
```

| Event         | Detail                         |
| ------------- | ------------------------------ |
| `kt-navigate` | `{ item, index }` — cancelable |

| Part   | Description   |
| ------ | ------------- |
| `nav`  | The `<nav>`   |
| `item` | A trail entry |
