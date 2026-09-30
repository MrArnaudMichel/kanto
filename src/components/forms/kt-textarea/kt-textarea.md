# `<kt-textarea>`

A multi-line field, with the same borderless fill and outline states as
`<kt-input>`.

```html
<kt-textarea placeholder="Describe the incident..." rows="5"></kt-textarea>
<kt-textarea maxlength="280" name="bio"></kt-textarea>
<kt-textarea error="280 characters maximum"></kt-textarea>
<kt-textarea resize="vertical" placeholder="As long as it needs to be"></kt-textarea>
```

## Resizing

Off by default. The grip is drawn by the operating system, lands on the field's
rounded corner and belongs to no design system — and a field the layout sized is
not usually the reader's to resize. Set `resize="vertical"` where the content
genuinely varies and the extra height will not break the screen around it.

## The counter

Setting `maxlength` shows a `0 / 280` counter, which turns red at the limit.
It exists because a `maxlength` alone is a silent failure: the browser simply
stops accepting keystrokes, with nothing on screen to explain why.

The counter is `aria-live="polite"`, so it is announced as the user approaches
the limit rather than on every character.

## Form participation

Form-associated, like `<kt-input>`: it serialises under its `name`, resets with
the form, and reports `valueMissing` when `required` and empty.

## API

| Property      | Attribute     | Type                   | Default  |
| ------------- | ------------- | ---------------------- | -------- |
| `value`       | `value`       | `string`               | `''`     |
| `name`        | `name`        | `string`               | `''`     |
| `placeholder` | `placeholder` | `string`               | `''`     |
| `rows`        | `rows`        | `number`               | `3`      |
| `maxlength`   | `maxlength`   | `number`               | —        |
| `disabled`    | `disabled`    | `boolean`              | `false`  |
| `readonly`    | `readonly`    | `boolean`              | `false`  |
| `required`    | `required`    | `boolean`              | `false`  |
| `error`       | `error`       | `string`               | `''`     |
| `label`       | `label`       | `string`               | `''`     |
| `resize`      | `resize`      | `'vertical' \| 'none'` | `'none'` |

| Event       | Detail              |
| ----------- | ------------------- |
| `kt-input`  | `{ value: string }` |
| `kt-change` | `{ value: string }` |

| Part      | Description             |
| --------- | ----------------------- |
| `base`    | The field container     |
| `control` | The native `<textarea>` |
| `counter` | The character counter   |
