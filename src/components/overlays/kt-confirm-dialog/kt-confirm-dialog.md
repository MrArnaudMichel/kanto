# `<kt-confirm-dialog>`

A centred yes/no overlay for an action worth stopping to think about.

```html
<kt-confirm-dialog
  heading="Delete this entity?"
  message="This action cannot be undone."
  confirm-label="Delete"
></kt-confirm-dialog>
```

```js
dialog.open = true;
dialog.addEventListener('kt-confirm', () => remove(entity));
dialog.addEventListener('kt-cancel', () => {});
```

## When

Destructive or irreversible work only. Editing belongs in a
`<kt-side-panel>`, which does not block the page behind it. A confirmation on
something reversible teaches people to dismiss confirmations.

## Defaults that fail safe

`role="alertdialog"`, and **focus lands on Cancel**, not Confirm. A stray Enter
meant for whatever was behind the dialog should not delete anything.

Escape and a backdrop click both report `kt-cancel` — never `kt-confirm`.
`variant="danger"` (the default) gives the confirm button the solid red
treatment, the only place in Kanto that colour is used.

## API

| Property       | Attribute       | Type                    | Default           |
| -------------- | --------------- | ----------------------- | ----------------- |
| `open`         | `open`          | `boolean`               | `false`           |
| `heading`      | `heading`       | `string`                | `'Are you sure?'` |
| `message`      | `message`       | `string`                | `''`              |
| `confirmLabel` | `confirm-label` | `string`                | `'Confirm'`       |
| `cancelLabel`  | `cancel-label`  | `string`                | `'Cancel'`        |
| `variant`      | `variant`       | `'danger' \| 'primary'` | `'danger'`        |

| Event        | Description                            |
| ------------ | -------------------------------------- |
| `kt-confirm` | Confirm pressed                        |
| `kt-cancel`  | Dismissed — button, Escape or backdrop |

| Slot      | Description                               |
| --------- | ----------------------------------------- |
| _default_ | Extra content between message and buttons |
