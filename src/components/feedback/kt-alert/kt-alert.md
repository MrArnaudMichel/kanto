# `<kt-alert>`

A message that stays on the page.

```html
<kt-alert
  variant="warning"
  heading="Storage almost full"
  description="You are using 88% of your quota."
  dismissible
>
  <kt-button slot="actions" size="small" variant="warning">Upgrade</kt-button>
</kt-alert>
```

## Against a toast

A **toast** is transient and interrupts; it belongs to the moment. An **alert**
sits in the layout and waits; it belongs to the page.

A form that failed to save, a trial about to expire, a consent notice — all
alerts. "Saved", "Copied", "3 rows deleted" — all toasts. Getting this backwards
is how important messages disappear after four seconds.

## Colour and urgency

The whole block takes the variant's tint and border, so the message's
temperature is legible before a word is read. `danger` is `aria-live="assertive"`
and interrupts the screen reader; everything else is polite and waits its turn.

`dismissible` adds the button and fires `kt-close` — **removing the alert is
yours**, because only the caller knows whether it should come back.

## API

| Property      | Attribute     | Type                                                        | Default  |
| ------------- | ------------- | ----------------------------------------------------------- | -------- |
| `variant`     | `variant`     | `'info' \| 'success' \| 'warning' \| 'danger' \| 'neutral'` | `'info'` |
| `heading`     | `heading`     | `string`                                                    | `''`     |
| `description` | `description` | `string`                                                    | `''`     |
| `dismissible` | `dismissible` | `boolean`                                                   | `false`  |
| `noIcon`      | `no-icon`     | `boolean`                                                   | `false`  |
| `icon`        | `icon`        | `string`                                                    | `''`     |

| Slot      | Description                          |
| --------- | ------------------------------------ |
| _default_ | Body, when `description` is not used |
| `actions` | Buttons, at the end                  |

| Event      | Description                    |
| ---------- | ------------------------------ |
| `kt-close` | The dismiss button was pressed |
