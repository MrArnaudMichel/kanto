# `<kt-otp-input>`

A one-time code — the six digits of a sign-in, a verification, a second factor —
one box per character.

```html
<form>
  <kt-otp-input label="Verification code" name="code" required></kt-otp-input>
</form>

<script>
  document.querySelector('kt-otp-input').addEventListener('kt-complete', (event) => {
    verify(event.detail.value);
  });
</script>
```

## Typing

Typing moves to the next box. Backspace clears a box, and from an empty one
steps back and clears the one before. The arrows, Home and End move between
boxes. A pasted code — with spaces or dashes, as codes are often written — is
cleaned and spread over the boxes from the one it was pasted into.

The first box asks the browser for `autocomplete="one-time-code"`, so a code
that arrived by text message fills itself in on a phone. `kt-change` fires as
the code changes, `kt-complete` once it is whole.

`length` sets how many characters the code has (6 by default). `type="numeric"`,
the default, takes digits and opens the number pad; `type="alphanumeric"` takes
letters and digits, shown in capitals.

## Forms

A form control: submitted under `name`, `required` until the code is whole
("Enter the whole code."), reset to its first `value` with the form, disabled
with a disabled fieldset. `error` shows a message under the boxes, announced
with each of them.

## Accessibility

A group named by `label`, each box named by its place — "Character 2 of 6" — so
a screen reader says where the person is in the code. Translate both strings
through `setStrings` as `otpCharacter` and `otpRequired`.

## API

| Property   | Attribute  | Type                          | Default     |
| ---------- | ---------- | ----------------------------- | ----------- |
| `value`    | `value`    | `string`                      | `''`        |
| `length`   | `length`   | `number`                      | `6`         |
| `type`     | `type`     | `'numeric' \| 'alphanumeric'` | `'numeric'` |
| `label`    | `label`    | `string`                      | `''`        |
| `name`     | `name`     | `string`                      | `''`        |
| `required` | `required` | `boolean`                     | `false`     |
| `disabled` | `disabled` | `boolean`                     | `false`     |
| `error`    | `error`    | `string`                      | `''`        |

| Event         | Detail              |
| ------------- | ------------------- |
| `kt-change`   | `{ value: string }` |
| `kt-complete` | `{ value: string }` |

| Part    | Description       |
| ------- | ----------------- |
| `group` | The boxes         |
| `box`   | One box           |
| `error` | The error message |
