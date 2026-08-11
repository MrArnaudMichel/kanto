# `<kt-modal>`

A centred dialog for anything that is not a yes/no question.

```html
<kt-modal open heading="Compose" description="This goes to the whole team.">
  <kt-textarea rows="6" placeholder="Write something..."></kt-textarea>
  <kt-button slot="footer" variant="dark">Save draft</kt-button>
  <kt-button slot="footer" icon="send">Send</kt-button>
</kt-modal>
```

## Against `<kt-confirm-dialog>`

The confirm dialog asks one thing and offers two answers, and its defaults are
tuned for that — Cancel takes focus, the confirm button is red. This one holds
_content_: a compose window, a command palette, a picker. You choose the footer.

Both are native `<dialog>`s, so the top layer, focus containment, page
inertness and Escape come from the platform rather than from a focus trap that
leaks.

## Guarding unsaved work

`kt-close` is cancelable, and that covers Escape too:

```js
modal.addEventListener('kt-close', (e) => {
  if (!draft.dirty) return;
  e.preventDefault();
  confirmDiscard.open = true;
});
```

`no-close-button` and `no-backdrop-close` narrow the ways out, but **Escape
always works**. A modal you cannot leave is a trap; cancelling `kt-close` is the
right way to guard one.

## API

| Property          | Attribute           | Type                                       | Default    |
| ----------------- | ------------------- | ------------------------------------------ | ---------- |
| `open`            | `open`              | `boolean`                                  | `false`    |
| `heading`         | `heading`           | `string`                                   | `''`       |
| `description`     | `description`       | `string`                                   | `''`       |
| `size`            | `size`              | `'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` |
| `noCloseButton`   | `no-close-button`   | `boolean`                                  | `false`    |
| `noBackdropClose` | `no-backdrop-close` | `boolean`                                  | `false`    |

| Method           | Description                               |
| ---------------- | ----------------------------------------- |
| `requestClose()` | Fires `kt-close`, closes unless cancelled |

| Slot      | Description                      |
| --------- | -------------------------------- |
| _default_ | The body                         |
| `header`  | Replaces the `heading` attribute |
| `footer`  | Actions. Hidden when empty.      |

| Event      | Description                      |
| ---------- | -------------------------------- |
| `kt-close` | Dismissal requested. Cancelable. |
