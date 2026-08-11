# `<kt-collapsible>`

A section that folds away.

```html
<kt-collapsible heading="Notifications" open>
  <kt-toggle checked>Email me about mentions</kt-toggle>
  <kt-toggle>Email me a weekly digest</kt-toggle>
</kt-collapsible>
```

## Built on `<details>`

Which buys three things for free:

- It **works before the JavaScript loads** — the browser opens and closes it on
  its own.
- **Find-in-page opens it.** A browser will expand a closed `<details>` to
  reveal a match inside it; a div with a click handler hides that text forever.
- It needs **no ARIA of its own**. `<summary>` is already a button with the
  right expanded state.

The default disclosure triangle is replaced with a chevron that rotates, which
is the only cosmetic liberty taken.

## API

| Property  | Attribute | Type      | Default |
| --------- | --------- | --------- | ------- |
| `open`    | `open`    | `boolean` | `false` |
| `heading` | `heading` | `string`  | `''`    |
| `plain`   | `plain`   | `boolean` | `false` |

`plain` drops the bottom rule, for a collapsible that is not one of a stacked
list.

| Slot      | Description                      |
| --------- | -------------------------------- |
| _default_ | The contents                     |
| `summary` | Replaces the `heading` attribute |

| Event       | Detail              |
| ----------- | ------------------- |
| `kt-toggle` | `{ open: boolean }` |

| Part      | Description        |
| --------- | ------------------ |
| `base`    | The `<details>`    |
| `summary` | The clickable row  |
| `content` | The revealed panel |
