# `<kt-time-input>`

A time of day typed into its parts — hours, minutes and, if asked, seconds.

```html
<kt-time-input label="Starts at" name="start" step="15" min="08:00" max="20:00"></kt-time-input>
<kt-time-input label="Logged at" seconds value="09:15:30"></kt-time-input>
```

It shares its keyboard with [`<kt-date-input>`](../kt-date-input/kt-date-input.md):
each part is a segment, typed digit by digit, stepped with the arrows, the
focus moving on as each fills — `1430` is half past two in the afternoon.

## The reader's clock

The clock is the one the reader's language reads: `14:30` in London and
Paris, `02:30 PM` in New York, `14.30` in Copenhagen. `hour-cycle` sets it
instead — `h12` for hours from 1 to 12 with AM/PM, `h23` for 0 to 23. The
locale is `locale` if set, else the page's `lang`, else the browser's
language.

On a 12-hour clock the AM/PM segment takes the first letter of either — `a`
or `p` — or the arrows. The hour reads with it: 12 AM is midnight, 12 PM noon.

## The value

Whatever the clock shows, the value is the 24-hour time `<input type="time">`
and a server speak: `14:30`, or `14:30:05` with `seconds`. It is `null` until
every segment is filled; a segment left at one digit is written out when the
focus leaves it, `9` becoming `09`. `kt-change` fires once per time, not per
keystroke.

`step` is how many minutes the arrows move by: with `step="15"`, `↑` from
`09:07` goes to `09:15`. Typed minutes are not rounded.

A time before `min` or after `max` puts the field in its error state, the
message in a tooltip on the alert icon. The value is `null` and the form sees
a `badInput`.

| Key           | Does                                                  |
| ------------- | ----------------------------------------------------- |
| digits        | fill the segment in focus                             |
| `a` / `p`     | AM or PM, on a 12-hour clock                          |
| `↑` / `↓`     | step the segment, wrapping round the clock            |
| `Home`/`End`  | the segment's first or last value                     |
| `←` / `→`     | the segment before or after                           |
| `Backspace`   | erases a digit, then steps back to the segment before |
| `:` `.` space | the next segment                                      |

## In a form

A form control: it submits the value under `name`, and nothing while the time
is incomplete. `required` blocks submission while it is empty, `error` shows a
message, and `form.reset()` puts back the initial value.

## API

| Property    | Attribute    | Type                             | Default            |
| ----------- | ------------ | -------------------------------- | ------------------ |
| `value`     | `value`      | `string \| null`                 | `null`             |
| `seconds`   | `seconds`    | `boolean`                        | `false`            |
| `hourCycle` | `hour-cycle` | `'h12' \| 'h23' \| ''`           | `''`, the locale's |
| `step`      | `step`       | `number`                         | `1`                |
| `min`       | `min`        | `string`                         | `''`               |
| `max`       | `max`        | `string`                         | `''`               |
| `name`      | `name`       | `string`                         | `''`               |
| `label`     | `label`      | `string`                         | `''`               |
| `locale`    | `locale`     | `string`                         | page, then browser |
| `size`      | `size`       | `'small' \| 'medium' \| 'large'` | `'medium'`         |
| `disabled`  | `disabled`   | `boolean`                        | `false`            |
| `required`  | `required`   | `boolean`                        | `false`            |
| `error`     | `error`      | `string`                         | `''`               |

| Event       | Detail                                                    |
| ----------- | --------------------------------------------------------- |
| `kt-change` | `{ value: string \| null }` — `HH:MM`, `HH:MM:SS`, `null` |

| Part      | Description                              |
| --------- | ---------------------------------------- |
| `field`   | The field                                |
| `segment` | An hour, minute, second or AM/PM segment |

## Accessibility

The field is a `group` named by `label`. Each segment is a `spinbutton` named
"Hour", "Minute", "Second" or "AM or PM", with its range and value. `Tab`
walks the segments. On a phone, the number segments bring up the numeric
keypad.
