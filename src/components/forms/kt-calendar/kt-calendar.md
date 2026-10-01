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

## A month and a year in two clicks

The title — "September 2026" — opens one panel: a scrolling list of years
beside the twelve months of the one chosen. Pick the year, then the month, and
the days are back, the day of the month kept: from 25 September, choosing March
1987 lands on 25 March 1987. The list opens on the chosen year, centred, and
reaches from `min` to `max` — or, without them, 120 years back and 50 ahead,
birthdays to plans. Typing four digits in the list jumps to that year. Months
wholly outside `min`/`max` are disabled.

The arrows beside the title page a month at a time; they are the only thing
that does.

## Two months

`months="2"` shows two months side by side — what `<kt-date-picker range>`
does, so a period across a month's end is two clicks. Each grid holds its own
days only, so none shows twice, and the keyboard moves across both, paging
only once it leaves the second.

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

In the year list:

| Key                     | Does                                                                 |
| ----------------------- | -------------------------------------------------------------------- |
| `↑` / `↓`               | Previous / next year                                                 |
| `Page Up` / `Page Down` | Ten years back / ahead                                               |
| `Home` / `End`          | First / last year offered                                            |
| Four digits             | That year                                                            |
| `Enter`, `Tab`          | On to the months                                                     |
| `Escape`                | Back to the days — and no further, so an enclosing dialog stays open |

In the months: the arrows, three to a row; `Page Up`/`Page Down` by year;
`Enter` to choose; `Escape` back to the days.

Focus follows every switch, so the keys keep working without a click in
between.

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
| `months` | `months`  | `1 \| 2`         | `1`                |
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
