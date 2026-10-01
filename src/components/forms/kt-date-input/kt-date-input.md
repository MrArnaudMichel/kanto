# `<kt-date-input>`

A date typed into its parts — day, month and year, each its own segment.

```html
<kt-date-input label="Date of birth" name="born" max="2026-12-31"></kt-date-input>
<kt-date-input label="Due date" calendar value="2026-09-25"></kt-date-input>
```

Where [`<kt-date-picker>`](../kt-date-picker/kt-date-picker.md) leads with a
calendar, this field leads with the keyboard: a date of birth, a date already
on paper, a date in a table of a hundred rows. With `calendar` it gets a
calendar too, a button away.

## The segments

The segments come in the order the reader's language writes a date, with its
separator: `25/09/2026` in London, `09/25/2026` in New York, `25.09.2026` in
Berlin. The locale is `locale` if set, else the page's `lang`, else the
browser's language. An empty segment shows what it wants — `dd`, `mm`, `yyyy`,
from `setStrings`.

The focus moves on as each segment fills, so a date is eight keystrokes:
`25092026`. A segment also moves on as soon as no other digit could follow — a
`4` in the day, a `2` in the month — and on a typed `/`, `.`, `-` or space.

| Key           | Does                                                         |
| ------------- | ------------------------------------------------------------ |
| digits        | fill the segment in focus                                    |
| `↑` / `↓`     | step the segment, wrapping; a day never past its month's end |
| `Home`/`End`  | the segment's first or last value                            |
| `←` / `→`     | the segment before or after                                  |
| `Backspace`   | erases a digit, then steps back to the segment before        |
| `/` `.` `-` … | the next segment                                             |

A year left at two digits is written out when the focus leaves it: `98` is
1998, `30` is 2030. Everything else is turned away, so the field never holds
text that is not a date in the making.

## ISO in and out

The value is ISO 8601 text, `2026-09-25`, and `null` until all three segments
are filled. `kt-change` fires when the date becomes complete, changes, or stops
being one — once per date, not per keystroke.

A date that does not exist — the 31st of February — or one outside
`min`/`max` puts the field in its error state, the message in a tooltip on the
alert icon, as `<kt-input>` does. The value is `null` and the form sees a
`badInput`.

## The calendar option

With `calendar`, a button at the end of the field opens a
[`<kt-calendar>`](../kt-calendar/kt-calendar.md) on the field's date, with the
focus in it. Choosing a day fills in the segments and closes it; `Escape`, or a
click outside, closes it and leaves the date as it was.

## In a form

A form control: it submits the ISO value under `name`, and nothing while the
date is incomplete. `required` blocks submission while it is empty, `error`
shows a message, and `form.reset()` puts back the initial value.

## API

| Property   | Attribute  | Type                             | Default            |
| ---------- | ---------- | -------------------------------- | ------------------ |
| `value`    | `value`    | `string \| null`                 | `null`             |
| `calendar` | `calendar` | `boolean`                        | `false`            |
| `min`      | `min`      | `string`                         | `''`               |
| `max`      | `max`      | `string`                         | `''`               |
| `name`     | `name`     | `string`                         | `''`               |
| `label`    | `label`    | `string`                         | `''`               |
| `locale`   | `locale`   | `string`                         | page, then browser |
| `size`     | `size`     | `'small' \| 'medium' \| 'large'` | `'medium'`         |
| `disabled` | `disabled` | `boolean`                        | `false`            |
| `required` | `required` | `boolean`                        | `false`            |
| `error`    | `error`    | `string`                         | `''`               |

| Event       | Detail                                           |
| ----------- | ------------------------------------------------ |
| `kt-change` | `{ value: string \| null }` — ISO date or `null` |

| Part      | Description                          |
| --------- | ------------------------------------ |
| `field`   | The field                            |
| `segment` | A day, month or year segment         |
| `trigger` | The calendar button, with `calendar` |
| `panel`   | The calendar popup, with `calendar`  |

## Accessibility

The field is a `group` named by `label`. Each segment is a `spinbutton` named
"Day", "Month" or "Year", with its range and value, so a screen reader
announces "Month, 09" and `↑`/`↓` work as it expects. `Tab` walks the segments,
then the calendar button. On a phone, the segments bring up the numeric
keypad.
