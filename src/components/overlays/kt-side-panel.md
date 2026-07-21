# `<kt-side-panel>`

A drawer sliding in from the right, for viewing or editing one record without
losing the list behind it.

```html
<kt-side-panel open eyebrow="Details" heading="Entity 4812">
  <kt-label-input label="Nom"><kt-input value="Entity 4812"></kt-input></kt-label-input>
  <kt-button slot="footer" full-width>Save</kt-button>
</kt-side-panel>
```

## Built on `<dialog>`

`showModal()` is doing real work here. It puts the panel in the **top layer**,
above every stacking context — which no z-index can guarantee — traps focus
inside it, makes the rest of the page inert, and handles Escape.

The fixed-position div this replaces did none of that: tabbing walked straight
out of the panel into the page behind it.

## Guarding unsaved changes

`kt-close` is cancelable. Cancel it and the panel stays open — including when
Escape was what triggered it.

```js
panel.addEventListener('kt-close', (e) => {
  if (!form.dirty) return;
  e.preventDefault();
  confirmDialog.open = true;
});
```

`no-backdrop-close` removes backdrop dismissal. Escape still works: a modal you
cannot escape from is a trap, and cancelling `kt-close` is the right way to
guard it.

## API

| Property          | Attribute           | Type      | Default     |
| ----------------- | ------------------- | --------- | ----------- |
| `open`            | `open`              | `boolean` | `false`     |
| `eyebrow`         | `eyebrow`           | `string`  | `'Details'` |
| `heading`         | `heading`           | `string`  | `''`        |
| `noBackdropClose` | `no-backdrop-close` | `boolean` | `false`     |

| Method           | Description                               |
| ---------------- | ----------------------------------------- |
| `requestClose()` | Fires `kt-close`, closes unless cancelled |

| Event      | Description                      |
| ---------- | -------------------------------- |
| `kt-close` | Dismissal requested. Cancelable. |

| Slot      | Description           |
| --------- | --------------------- |
| _default_ | Panel body            |
| `footer`  | Pinned below the body |
