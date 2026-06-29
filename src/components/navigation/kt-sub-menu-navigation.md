# `<kt-sub-menu-navigation>`

The sidebar: uppercase overline section titles over lists of links. This is the
navigation the Kanto docs shell itself uses.

```js
nav.sections = [
  {
    title: 'Forms',
    items: [
      { label: 'Input', href: '/input' },
      { label: 'Select', href: '/select' },
    ],
  },
  { title: 'Examples', items: [{ label: 'Tableau de bord', href: '/dashboard' }] },
];
nav.activeHref = location.pathname;
```

A section without a `title` renders as a bare list — useful for a trailing group
of links that needs no heading.

## Active state

Set `activeHref` and the matching link is highlighted and marked
`aria-current="page"`. An item can also force it with `active: true`, for
routes that do not map to a single href.

## Client-side routing

Same contract as `<kt-breadcrumb>`: `kt-navigate` is cancelable, and modified
clicks are left to the browser.

```js
nav.addEventListener('kt-navigate', (e) => {
  e.preventDefault();
  router.push(e.detail.item.href);
});
```

## API

| Property     | Attribute     | Type             | Default                   |
| ------------ | ------------- | ---------------- | ------------------------- |
| `sections`   | —             | `KtNavSection[]` | `[]`                      |
| `activeHref` | `active-href` | `string`         | `''`                      |
| `label`      | `label`       | `string`         | `'Navigation secondaire'` |

```ts
interface KtNavSection {
  title?: string;
  items: KtNavItem[];
}

interface KtNavItem {
  label: string;
  href?: string;
  active?: boolean;
}
```

| Event         | Detail                  |
| ------------- | ----------------------- |
| `kt-navigate` | `{ item }` — cancelable |

| Part      | Description       |
| --------- | ----------------- |
| `nav`     | The `<nav>`       |
| `section` | A section         |
| `title`   | A section title   |
| `item`    | A navigation link |
