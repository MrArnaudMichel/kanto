# `<kt-calendar>`

A month calendar to pick a day or a period from, shown in the page.

```html
<kt-calendar value="2026-09-25"></kt-calendar>
<kt-calendar range value="2026-09-07/2026-09-18" min="2026-01-01"></kt-calendar>
```

It is the calendar `<kt-date-picker>` opens in its popup. Use it on its own
when the calendar _is_ the interface — a booking page, a dashboard's date
filter, a planning view — and `<kt-date-picker>` when it is only a way to fill
a field.

## Months and years in three clicks

The title's month and year are buttons:

- **The month** opens a grid of the twelve months.
- **The year** opens a grid of twelve years; the arrows page twelve years at a
  time.

Picking a year shows its months, picking a month shows its days — so a date
decades away is three or four clicks, not three hundred pages. The day of the
month is kept on the way: from 25 September, choosing March lands on 25 March.
Months and years wholly outside `min`/`max` are disabled.

## Keyboard

In the days, the WAI-ARIA date grid pattern:

| Key                          | Does                            |
| ---------------------------- | ------------------------------- |
| `←` / `→`                    | Previous / next day             |
| `↑` / `↓`                    | Same day, previous / next week  |
| `Home` / `End`               | First / last day of the week    |
| `Page Up` / `Page Down`      | Same day, previous / next month |
| `Shift` + `Page Up` / `Down` | Same day, previous / next year  |
| `Enter` / `Space`            | Choose the day in focus         |

In the months and years:

| Key                     | Does                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| Arrows                  | Move through the grid, three to a row                                |
| `Page Up` / `Page Down` | Previous / next year, or twelve years                                |
| `Enter` / `Space`       | Choose, and go down a level                                          |
| `Escape`                | Back to the days — and no further, so an enclosing dialog stays open |

Focus follows every switch of view, so the arrow keys keep working without a
click in between.

## ISO values and locales

As for `<kt-date-picker>`: the value is ISO 8601 text — `2026-09-25`, or
`2026-09-07/2026-09-18` with `range` — and names, the first day of the week
and every accessible label follow `locale`, else the page's `lang`, else the
browser's language. A period takes two picks in either order and fires
`kt-change` once, with the whole period.

`<kt-calendar>` is not a form control; inside a form, use `<kt-date-picker>`.

## API

| Property | Attribute | Type             | Default            |
| -------- | --------- | ---------------- | ------------------ |
| `value`  | `value`   | `string \| null` | `null`             |
| `range`  | `range`   | `boolean`        | `false`            |
| `min`    | `min`     | `string`         | `''`               |
| `max`    | `max`     | `string`         | `''`               |
| `locale` | `locale`  | `string`         | page, then browser |
| `label`  | `label`   | `string`         | from `setStrings`  |

| Method    | Description                                |
| --------- | ------------------------------------------ |
| `focus()` | Focuses the current day — chosen, or today |

| Event       | Detail                                     |
| ----------- | ------------------------------------------ |
| `kt-change` | `{ value: string }` — ISO date or interval |

| Part   | Description  |
| ------ | ------------ |
| `base` | The calendar |
| `day`  | A day cell   |
