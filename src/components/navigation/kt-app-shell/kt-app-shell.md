# `<kt-app-shell>`

The frame of an application: a header along the top, a sidebar down the side,
and the content, which scrolls on its own.

```html
<kt-app-shell style="height: 100dvh">
  <a slot="header" href="/">Northwind</a>
  <kt-sub-menu-navigation slot="sidebar"></kt-sub-menu-navigation>

  <h1>Overview</h1>
</kt-app-shell>
```

The shell fills its container's height: give the container one —
`height: 100dvh` on a page, a fixed height in a preview. The header and the
sidebar stay put while the content scrolls.

## The sidebar

Wide, the sidebar sits beside the content, and the toggle at the start of the
header narrows it to a rail: `collapsed` is reflected, so the sidebar's content
can follow it.

```css
kt-app-shell[collapsed] .nav-label {
  display: none;
}
```

Narrower than `breakpoint` — 900px of the **shell's own width**, not the
viewport's — the sidebar leaves the layout. The toggle opens it as a drawer over
the content, behind a backdrop; Escape or a click on the backdrop closes it. The
drawer takes the focus as it opens and gives it back to the toggle as it
closes, and a closed drawer is inert, so Tab never wanders into a panel that is
not there. `narrow` is reflected while it applies.

`toggleSidebar()` does what the toggle does; `kt-sidebar-toggle` reports it,
with `detail.open`. Set `no-toggle` when the header brings its own control, and
call `toggleSidebar()` from it.

## Sizes

| CSS property                   | Default |
| ------------------------------ | ------- |
| `--kt-app-shell-sidebar-width` | `240px` |
| `--kt-app-shell-rail-width`    | `64px`  |
| `--kt-app-shell-header-height` | `56px`  |

## Accessibility

The sidebar is an `<aside>` named by `label` — "Sidebar" by default, translated
through `setStrings` — and the content a `<main>`, so a page built on the shell
has its landmarks without writing them. The toggle is named after the sidebar
it controls, with `aria-controls` and `aria-expanded`, so it reads as "Sidebar,
expanded" or "collapsed" rather than as a picture of a panel.

## API

| Property      | Attribute      | Type      | Default |
| ------------- | -------------- | --------- | ------- |
| `collapsed`   | `collapsed`    | `boolean` | `false` |
| `sidebarOpen` | `sidebar-open` | `boolean` | `false` |
| `breakpoint`  | `breakpoint`   | `number`  | `900`   |
| `noToggle`    | `no-toggle`    | `boolean` | `false` |
| `label`       | `label`        | `string`  | `''`    |

| Event               | Detail              |
| ------------------- | ------------------- |
| `kt-sidebar-toggle` | `{ open: boolean }` |

| Part      | Description          |
| --------- | -------------------- |
| `header`  | The top bar          |
| `sidebar` | The `<aside>`        |
| `main`    | The `<main>`         |
| `toggle`  | The sidebar's toggle |
