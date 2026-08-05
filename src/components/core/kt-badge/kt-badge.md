# `<kt-badge>`

A small count or delta.

```html
<kt-badge pill>4</kt-badge>
<kt-badge variant="danger">-2%</kt-badge>
<kt-badge variant="success" value="+12%"></kt-badge>
<kt-badge pill max="99">128</kt-badge>
```

## Against `<kt-chip>`

A **chip** labels a thing — a status, a category, a tag — and can be a control.
A **badge** is a _number attached to something else_: the four unread in a
mailbox, the −2% under a figure.

A badge is never interactive, and it is never the only place that information
appears. If the count matters on its own, it needs words too.

## Capping

`max` turns a long number into `99+`. It only applies when the content is a
number, so `<kt-badge max="99">new</kt-badge>` still says `new`.

## API

| Property  | Attribute | Type                                                                     | Default     |
| --------- | --------- | ------------------------------------------------------------------------ | ----------- |
| `variant` | `variant` | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'neutral'` |
| `value`   | `value`   | `string`                                                                 | `''`        |
| `pill`    | `pill`    | `boolean`                                                                | `false`     |
| `max`     | `max`     | `number`                                                                 | —           |

| Slot      | Description                    |
| --------- | ------------------------------ |
| _default_ | Content. Falls back to `value` |
