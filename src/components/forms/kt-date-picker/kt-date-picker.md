# `<kt-date-picker>`

A date field with a calendar, for one day or a period.

```html
<kt-date-picker label="Due date" name="due" min="2026-01-01"></kt-date-picker>
<kt-date-picker range label="Report period" value="2026-09-01/2026-09-25"></kt-date-picker>
```

## ISO in, the reader's language out

The value is ISO 8601 text — what a server, a database and
`<input type="date">` already speak:

- one day: `2026-09-25`
- a period, with `range`: `2026-09-01/2026-09-25`, the ISO interval

What the field shows is the same value formatted for the reader: "25 Sept
2026", "1–25 Sept 2026". The calendar's month names, weekday names and first
day of the week follow the locale too — weeks start on Monday in France, on
Sunday in the US. The locale is `locale` if set, else the page's `lang`, else
the browser's language.

No time, no time zone: a date picker deals in days, and a day never shifts by
one because someone opened the form in another zone.

## Choosing a period

With `range`, the first pick sets one end and the calendar stays open; the
band between it and the pointer — or the day in focus — previews the period;
the second pick sets the other end, in whichever order they came.
`kt-change` fires once, with the whole period.

## Keyboard

The trigger opens the calendar with Enter, Space or `↓`. Inside, the WAI-ARIA
date picker dialog pattern:

| Key                          | Does                            |
| ---------------------------- | ------------------------------- |
| `←` / `→`                    | Previous / next day             |
| `↑` / `↓`                    | Same day, previous / next week  |
| `Home` / `End`               | First / last day of the week    |
| `Page Up` / `Page Down`      | Same day, previous / next month |
| `Shift` + `Page Up` / `Down` | Same day, previous / next year  |
| `Enter` / `Space`            | Choose the day in focus         |
| `Escape`                     | Close, focus back on the field  |

Tabbing out closes the calendar. Days outside `min`/`max` can be reached — so
the keyboard never gets stuck at a boundary — but not chosen.

## In a form

A form control: it submits the ISO value under `name`. A period submits
nothing until both ends are chosen. `required` blocks submission while it is
empty, `error` shows a message, and `form.reset()` puts back the initial
value.

## API

| Property      | Attribute     | Type                             | Default            |
| ------------- | ------------- | -------------------------------- | ------------------ |
| `value`       | `value`       | `string \| null`                 | `null`             |
| `range`       | `range`       | `boolean`                        | `false`            |
| `min`         | `min`         | `string`                         | `''`               |
| `max`         | `max`         | `string`                         | `''`               |
| `name`        | `name`        | `string`                         | `''`               |
| `label`       | `label`       | `string`                         | `''`               |
| `placeholder` | `placeholder` | `string`                         | from `setStrings`  |
| `locale`      | `locale`      | `string`                         | page, then browser |
| `size`        | `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`         |
| `disabled`    | `disabled`    | `boolean`                        | `false`            |
| `required`    | `required`    | `boolean`                        | `false`            |
| `clearable`   | —             | `boolean`                        | `true`             |
| `error`       | `error`       | `string`                         | `''`               |

| Event       | Detail                                                     |
| ----------- | ---------------------------------------------------------- |
| `kt-change` | `{ value: string \| null }` — ISO date, interval or `null` |

| Part      | Description        |
| --------- | ------------------ |
| `trigger` | The field          |
| `panel`   | The calendar popup |
| `day`     | A day cell         |
