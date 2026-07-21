# `<kt-label-input>`

A label above a form control, with a red asterisk when it is required.

```html
<kt-label-input label="Email address" required>
  <kt-input name="email" type="email" required></kt-input>
</kt-label-input>
```

## Why it is not a `<label>`

Native label association does not cross a shadow boundary. `for="..."` needs the
control's id in the same tree, and wrapping a control in a `<label>` only works
when both are in that tree — a slotted `<kt-input>` is not.

So this element passes its text down to the slotted control's `label` property,
which the control turns into its own `aria-label`. Controls without that
property get `aria-label` set directly. Clicking the label focuses the control,
the way a real label does.

That means the asterisk is `aria-hidden`: screen readers get "required" from the
control's own `required` attribute, not from a decorative star in the label.

## Works with anything

```html
<kt-label-input label="Notes">
  <kt-textarea maxlength="500"></kt-textarea>
</kt-label-input>

<kt-label-input label="Region">
  <kt-select></kt-select>
</kt-label-input>

<kt-label-input label="File">
  <input type="file" />
</kt-label-input>
```

## API

| Property   | Attribute  | Type      | Default |
| ---------- | ---------- | --------- | ------- |
| `label`    | `label`    | `string`  | `''`    |
| `required` | `required` | `boolean` | `false` |

| Slot      | Description          |
| --------- | -------------------- |
| _default_ | The control to label |

| Part    | Description   |
| ------- | ------------- |
| `label` | The `<label>` |
