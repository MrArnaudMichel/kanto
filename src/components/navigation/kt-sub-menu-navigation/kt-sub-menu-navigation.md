# `<kt-sub-menu-navigation>`

The sidebar: uppercase overline section titles over lists of links, to any
depth. This is the navigation both the Kanto docs shell and the console
application use.

```js
nav.sections = [
  {
    title: 'Workspace',
    items: [
      { label: 'Home', href: '#/home', icon: 'house' },
      { label: 'Inbox', href: '#/inbox', icon: 'inbox', badge: '4' },
      {
        label: 'Settings',
        icon: 'settings',
        children: [
          { label: 'General', href: '#/settings/general' },
          {
            label: 'Members',
            children: [{ label: 'Roles', href: '#/settings/members/roles' }],
          },
        ],
      },
    ],
  },
];
nav.activeHref = location.hash;
```

A section without a `title` renders as a bare list — useful for a trailing group
of links that needs no heading.

## Nesting

The recursion is the point. Every product grows a third level eventually —
Settings holds Members holds Roles — and the usual answer is to hand-roll that
one branch beside the component, which is how two navigation styles end up on
one screen. Here a branch renders exactly like the level above it: same row,
same states, indented by its depth, with a chevron instead of an href.

An item with `children` is a `<button aria-expanded>`, not a link, because it
goes nowhere. Give a branch `open: true` to start it expanded.

**A branch holding the current page opens itself**, whatever was clicked, and
refuses to fold while it still does — arriving on a page the sidebar does not
show is worse than losing a fold. It is marked `within` rather than `active`:
the current page is below it, not it.

## Active state

Set `activeHref` and the matching link is highlighted, marked
`aria-current="page"` and given an accent bar. The bar matters: it is what
survives a forced-colours mode, where the tint does not. An item can also force
the state with `active: true`, for routes that do not map to a single href.

## In a sidebar

`flush` drops the card background, padding and radius, for a full-height
sidebar that already owns its surface. `collapsed` reduces every row to its
icon; labels, badges and open branches are hidden rather than clipped, because
a label sliced in half at 48px reads as a bug rather than as a narrow sidebar.

```html
<kt-sub-menu-navigation flush collapsed></kt-sub-menu-navigation>
```

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

| Property     | Attribute     | Type             | Default                  |
| ------------ | ------------- | ---------------- | ------------------------ |
| `sections`   | —             | `KtNavSection[]` | `[]`                     |
| `activeHref` | `active-href` | `string`         | `''`                     |
| `label`      | `label`       | `string`         | `'Secondary navigation'` |
| `flush`      | `flush`       | `boolean`        | `false`                  |
| `collapsed`  | `collapsed`   | `boolean`        | `false`                  |

```ts
interface KtNavSection {
  title?: string;
  items: KtNavItem[];
}

interface KtNavItem {
  label: string;
  href?: string;
  icon?: string; // lucide name; conventionally only the top level carries one
  badge?: string; // a count or a short status, right-aligned
  active?: boolean;
  disabled?: boolean;
  children?: KtNavItem[]; // any depth
  open?: boolean; // expanded on first render
}
```

| Event         | Detail                  |
| ------------- | ----------------------- |
| `kt-navigate` | `{ item }` — cancelable |
| `kt-toggle`   | `{ item, open }`        |

| Part      | Description                            |
| --------- | -------------------------------------- |
| `nav`     | The `<nav>`                            |
| `section` | A section                              |
| `title`   | A section title                        |
| `item`    | A navigation link or branch, any depth |
