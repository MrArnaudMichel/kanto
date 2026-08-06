# `<kt-empty-state>`

What a screen shows when it has nothing to show.

```html
<kt-empty-state
  icon="inbox"
  heading="Nothing in your inbox"
  description="New messages will appear here as they arrive."
>
  <kt-button slot="actions" icon="plus">Compose</kt-button>
</kt-empty-state>
```

Worth a component because the empty case is where products are usually
thinnest, and where they most need to say what happens next. An icon, a
sentence and an action beat a blank panel every time — and "no results" after a
search is a different message from "nothing here yet", so the wording is a
property rather than a default.

Use `compact` inside a card or a panel, where the full 48px of padding would
push everything else off screen.

## API

| Property      | Attribute     | Type      | Default   |
| ------------- | ------------- | --------- | --------- |
| `icon`        | `icon`        | `string`  | `'inbox'` |
| `heading`     | `heading`     | `string`  | `''`      |
| `description` | `description` | `string`  | `''`      |
| `compact`     | `compact`     | `boolean` | `false`   |

| Slot      | Description                                   |
| --------- | --------------------------------------------- |
| _default_ | Extra content between description and actions |
| `actions` | Buttons                                       |
