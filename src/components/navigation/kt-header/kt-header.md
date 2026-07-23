# `<kt-header>`

The application header: a banner landmark holding the brand, the primary
navigation and a row of actions.

```html
<kt-header sticky>
  <a slot="brand" href="/">KANTO</a>

  <nav>
    <a href="/docs">Docs</a>
    <a href="/components">Components</a>
  </nav>

  <kt-button slot="actions" size="small" variant="dark" icon="search">Search</kt-button>

  <nav slot="menu">
    <a href="/docs">Docs</a>
    <a href="/components">Components</a>
  </nav>

  <kt-tabs slot="bottom"></kt-tabs>
</kt-header>
```

## Slots

| Slot      | Where                                                      |
| --------- | ---------------------------------------------------------- |
| `brand`   | Start of the bar. Logo or wordmark.                        |
| _default_ | Middle. Primary navigation.                                |
| `actions` | End. Stays visible at every width.                         |
| `menu`    | What the menu button reveals below the breakpoint.         |
| `bottom`  | A second row under the bar — sub-navigation, a breadcrumb. |

`menu` is a separate slot rather than a reuse of the default one because a node
can only be assigned to one slot. Put a compact copy of the navigation there —
usually a plain stacked list rather than the horizontal bar.

## Collapsing

Below `--kt-header-breakpoint` (900px) the default slot is hidden and a menu
button appears; pressing it reveals the `menu` slot as a panel under the bar.

The breakpoint is a token rather than a fixed media query because how much
navigation fits depends entirely on how much navigation you put in — a header
with two links and one with eight do not want the same threshold.

Call `closeMenu()` after routing, or the panel stays open over the new page.

## Sticky and translucent

`sticky` pins the header and makes it translucent with a backdrop blur — but
only where `backdrop-filter` is supported. Without the blur it stays opaque: a
semi-transparent bar over scrolling content with nothing blurring it is simply
hard to read.

## API

| Property   | Attribute  | Type      | Default |
| ---------- | ---------- | --------- | ------- |
| `sticky`   | `sticky`   | `boolean` | `false` |
| `bordered` | `bordered` | `boolean` | `true`  |
| `label`    | `label`    | `string`  | `''`    |

| Method / getter | Description               |
| --------------- | ------------------------- |
| `closeMenu()`   | Shuts the collapsed panel |
| `isMenuOpen`    | Whether it is showing     |

| Event            | Detail              |
| ---------------- | ------------------- |
| `kt-menu-toggle` | `{ open: boolean }` |

| CSS property             | Default | Description                    |
| ------------------------ | ------- | ------------------------------ |
| `--kt-header-height`     | `64px`  | Height of the main row         |
| `--kt-header-breakpoint` | `900px` | Where the navigation collapses |

| Part     | Description    |
| -------- | -------------- |
| `base`   | The `<header>` |
| `bar`    | The main row   |
| `bottom` | The second row |
