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

## Typing a date

The field takes a date typed the way the reader writes it, on `Enter` or when
it is left:

- in numbers, in the language's order: `25/09/2026` in London, `9/25/2026` in
  New York, `25.09.2026` in Berlin, ISO `2026-09-25` anywhere;
- with the month's name, short or long: `25 Sept 2026`, `25 septembre`;
- without the year when it is this one, and with two digits for it — `98` is
  1998, `30` is 2030;
- a period as two dates around a dash: `1/9 – 25/9/2026`.

What does not read as a date, or falls outside `min`/`max`, puts the field in
its error state — the message in a tooltip on the alert icon, shown while the
field has focus, as `<kt-input>` does — and the value it had is kept. The form
sees a `badInput`. `Escape` puts the text back; emptying the field empties the
value.

## The calendar

The calendar button leads the field and opens the popup, a
[`<kt-calendar>`](../kt-calendar/kt-calendar.md), with the focus in it; a click
in the text opens it too, leaving the focus to type, and `↓` from the text
moves into it. Its title opens the year and month panel, so a date years away
is two clicks. A single date gets a **Today** button under it.

`Escape` closes it and puts the focus back in the field — except in the year
and month panel, where it first goes back to the days. Tabbing out closes it
too. Days outside `min`/`max` can be reached, so the keyboard never gets stuck
at a boundary, but not chosen.

## Choosing a period

With `range`, the popup leads with the periods a dashboard asks for most —
today, the last 7 and 30 days, this month and last, this year, each ending
today — beside two months. A click on a period applies it and closes; the one
the value matches is marked, and one reaching outside `min`/`max` is disabled.

```js
picker.presets = [
  { label: 'Q3 2026', value: '2026-07-01/2026-09-30' },
  { label: 'Q4 2026', value: '2026-10-01/2026-12-31' },
];
picker.presets = []; // no column
```

In the calendar, the first pick sets one end; the band between it and the
pointer — or the day in focus — previews the period; the second sets the other
end, in whichever order. `kt-change` fires once, with the whole period.

Below 720px wide the popup shows one month, with the periods wrapped above it.

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
| `presets`     | —             | `KtDatePreset[]`                 | the six above      |
| `error`       | `error`       | `string`                         | `''`               |

| Event       | Detail                                                     |
| ----------- | ---------------------------------------------------------- |
| `kt-change` | `{ value: string \| null }` — ISO date, interval or `null` |

| Part       | Description                       |
| ---------- | --------------------------------- |
| `field`    | The field                         |
| `input`    | The text the date is typed into   |
| `trigger`  | The button that opens the popup   |
| `panel`    | The calendar popup                |
| `presets`  | The column of periods, with range |
| `calendar` | The `<kt-calendar>` inside it     |
