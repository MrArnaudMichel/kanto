# `<kt-badge>`

A compact label: a pill `tag`, a monospaced `code` token, a `category` tinted
with a colour of your choosing, or a `count`.

```html
<kt-badge>Design systems</kt-badge>
<kt-badge tone="success">Active</kt-badge>
<kt-badge variant="code">--surface-card</kt-badge>
<kt-badge variant="category" color="#3987e5">Infrastructure</kt-badge>
<kt-badge variant="count" tone="danger" max="99">128</kt-badge>
<kt-badge icon="user" removable>Assigned to me</kt-badge>
```

## Shape and colour are separate

`variant` is the **shape** — what kind of thing this is. `tone` is the
**colour** — what it means. They are separate properties because they answer
different questions: a tag can be neutral or dangerous, and so can a count.
Folding them into one list would give you nine variants and still no way to say
"a tag, but this one is a warning".

| `variant`  | What it is                                           |
| ---------- | ---------------------------------------------------- |
| `tag`      | The default. A pill: a label, a filter, a topic.     |
| `code`     | A monospaced token — a property name, a flag, a key. |
| `category` | Tinted with `color`, for a palette the data owns.    |
| `count`    | A number pinned to something else.                   |

`count` is the one shape with no border. A number on a nav item is a mark on
the thing it counts, not a label with an outline of its own — and at that size
a border is most of what you see.

`tone` uses the system's tinted pair throughout: the colour behind at low
opacity, the colour itself as the ink. The same pair a secondary button, a
danger button and an avatar wear, so a badge beside any of them reads as one
family.

## Categories

`category` takes any CSS colour and fills at 20% of it:

```html
<kt-badge variant="category" color="var(--color-success-base)">Delivered</kt-badge>
<kt-badge variant="category" color="rgb(57, 135, 229)">Infrastructure</kt-badge>
```

The mixing is `color-mix`, which is honest for every notation. The build this
replaced concatenated a `"33"` onto the string and produced garbage for
`rgb()` and for named colours.

Reach for `tone` when the meaning is one of the system's six states, and
`category` when the palette belongs to the data — a project colour, a label the
user picked.

## Counting

`max` caps a numeric label: `max="99"` on `128` shows `99+`. A non-numeric
label is left alone, so `max` is safe to set from a template that does not know
what it will be given.

## Interaction

Neither `clickable` nor `removable` is on by default, because most badges are
labels and a label that looks pressable is a lie.

`clickable` makes it a real control — `role="button"`, a tab stop, Enter and
Space — and fires `kt-badge-click`. `removable` adds a remove button that fires
a cancelable `kt-remove`; cancel it and remove the badge yourself once the
server agrees. A badge that is both does not report the click when the remove
button is what was pressed.

## API

| Property    | Attribute   | Type                                                                     | Default     |
| ----------- | ----------- | ------------------------------------------------------------------------ | ----------- |
| `variant`   | `variant`   | `'tag' \| 'code' \| 'category' \| 'count'`                               | `'tag'`     |
| `tone`      | `tone`      | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'neutral'` |
| `size`      | `size`      | `'small' \| 'medium'`                                                    | `'medium'`  |
| `label`     | `label`     | `string`                                                                 | `''`        |
| `color`     | `color`     | `string` — any CSS colour, for `category`                                | `''`        |
| `icon`      | `icon`      | `string` — lucide name, before the text                                  | `''`        |
| `clickable` | `clickable` | `boolean`                                                                | `false`     |
| `removable` | `removable` | `boolean`                                                                | `false`     |
| `max`       | `max`       | `number`                                                                 | —           |
| `error`     | `error`     | `boolean` — shorthand for `tone="danger"`                                | `false`     |

| Event            | Detail       |
| ---------------- | ------------ |
| `kt-badge-click` | — cancelable |
| `kt-remove`      | — cancelable |

| Slot      | Description                      |
| --------- | -------------------------------- |
| _default_ | The text. Falls back to `label`. |

| CSS property       | Description                          |
| ------------------ | ------------------------------------ |
| `--kt-badge-color` | Category hue; the fill is it at 20%. |

| Part     | Description                         |
| -------- | ----------------------------------- |
| `base`   | The container                       |
| `remove` | The remove button, when `removable` |
