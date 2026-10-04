# `<kt-prompt-input>`

The field a person writes to an assistant in: it grows with what is written,
sends on Enter, and shows the sending on its own send button.

```html
<kt-prompt-input placeholder="Ask Northwind anything"></kt-prompt-input>

<script>
  const prompt = document.querySelector('kt-prompt-input');
  prompt.addEventListener('kt-submit', (event) => {
    event.detail.wait(api.ask(event.detail.value));
  });
</script>
```

## Sending

Enter sends; Shift+Enter starts a new line. With `submit-on="mod-enter"`,
Enter starts a new line and Cmd or Ctrl+Enter sends — for long messages,
where a stray Enter should not send half a thought. An input method composing
a character keeps Enter for itself.

`kt-submit` carries the text and `wait(promise)`. Hand it the request:

- the send button runs it — its plane turns into the spinner, then flies off;
- the field holds the text, read-only, until the request settles;
- on success the field empties; on failure the text stays, to send again.

Without `wait`, the field empties as soon as it sends. `submit()` sends from
script, as Enter would. Nothing is sent while the text is blank — the send
button says so by being disabled — nor while `disabled`.

## Growing

The field starts one line tall and grows with each line, up to `max-rows`
(8 by default); past that it scrolls.

## Slots

| Slot          | Where                                                                         |
| ------------- | ----------------------------------------------------------------------------- |
| `attachments` | Above the text: files or context added to the message. Collapses while empty. |
| `actions`     | Beside the send button: attach, a model picker, a mode.                       |

```html
<kt-prompt-input>
  <kt-badge slot="attachments" icon="file" removable>q3-report.pdf</kt-badge>
  <kt-button
    slot="actions"
    size="small"
    variant="secondary-no-bg"
    icon="paperclip"
    label="Attach a file"
  ></kt-button>
</kt-prompt-input>
```

## Accessibility

A `<textarea>` named by `label` — "Message" by default — and a send button
named "Send", both translated through `setStrings`. The button is a real
button, reached by Tab after the field. While a message is sending, the field
is read-only rather than disabled, so the focus stays where the person left it.

## API

| Property      | Attribute     | Type                     | Default   |
| ------------- | ------------- | ------------------------ | --------- |
| `value`       | `value`       | `string`                 | `''`      |
| `placeholder` | `placeholder` | `string`                 | `''`      |
| `label`       | `label`       | `string`                 | `''`      |
| `disabled`    | `disabled`    | `boolean`                | `false`   |
| `maxRows`     | `max-rows`    | `number`                 | `8`       |
| `submitOn`    | `submit-on`   | `'enter' \| 'mod-enter'` | `'enter'` |

| Event       | Detail                             |
| ----------- | ---------------------------------- |
| `kt-input`  | `{ value: string }`                |
| `kt-submit` | `{ value: string, wait(promise) }` |

| Part       | Description             |
| ---------- | ----------------------- |
| `base`     | The field               |
| `textarea` | The native `<textarea>` |
| `send`     | The send button         |
