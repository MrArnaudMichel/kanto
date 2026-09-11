# `<kt-input>`

A single-line text field.

Kanto fields are borderless: a fill on `--color-dark-12` that gains a 2px
**outline** — grey on hover, primary on focus, danger on error. An outline sits
outside the box, so none of those states reflow the layout.

```html
<kt-input placeholder="Search everything..." icon="search"></kt-input>
<kt-input type="password" name="password"></kt-input>
<kt-input error="Invalid email address" value="not-an-address"></kt-input>
<kt-input size="small" placeholder="Filtrer"></kt-input>
```

## Forms

`<kt-input>` is a form-associated custom element. It serialises into `FormData`
under its `name`, resets with the form, and reports validity like a native
input — no hidden mirror input, no manual wiring.

```html
<form>
  <kt-input name="email" type="email" required></kt-input>
  <kt-button type="submit">Send</kt-button>
</form>
```

```js
new FormData(form).get('email'); // the field's value
```

## Reading the value

`value` is a property, and a `value` attribute seeds it and becomes the reset
value. Listn for `kt-change` for a committed value, `kt-input` for every
keystroke:

```js
input.addEventListener('kt-change', (e) => console.log(e.detail.value));
```

The inner `change` event is stopped at the boundary rather than allowed to leak
out retargeted and untyped.

## Password and clear

`type="password"` adds a reveal toggle. Any non-empty field shows a clear
button, which rotates 90° on hover; set `clearable="false"` to suppress it.
Both are `tabindex="-1"` — they are conveniences for the mouse, and putting
them in the tab order would double the number of stops in a form.

## Phone mode

`type="tel"` adds a country picker: flag, dial code, and a searchable panel.

```html
<kt-input type="tel" name="phone" country="be"></kt-input>
```

`value` holds the **national digits only** — `612345678` — and the field
displays them grouped (`6 12 34 56 78`, pairs after the first digit for France,
threes elsewhere). What the _form_ receives is the full international number,
`+33612345678`: submitting national digits without the country would throw away
the thing the user just picked.

Six countries ship by default. Pass your own list for a wider audience:

```js
input.countries = [{ id: 'ca', name: 'Canada', dialCode: '1', format: '123-456-7890' }, ...];
```

Phone mode is reached **only** through `type="tel"`. Sniffing the placeholder,
the name or the icon for `/tel|phone/` instead would turn any field named
`telephone_verifie` into a country picker.

## Labelling

Wrap the field in `<kt-label-input>`, or give it a `label` when there is no
visible one:

```html
<kt-label-input label="Email address" required>
  <kt-input name="email" type="email" required></kt-input>
</kt-label-input>

<kt-input label="Search" icon="search"></kt-input>
```

## API

| Property       | Attribute      | Type                             | Default    |
| -------------- | -------------- | -------------------------------- | ---------- |
| `value`        | `value`        | `string`                         | `''`       |
| `name`         | `name`         | `string`                         | `''`       |
| `type`         | `type`         | `string`                         | `'text'`   |
| `placeholder`  | `placeholder`  | `string`                         | `''`       |
| `size`         | `size`         | `'small' \| 'medium' \| 'large'` | `'medium'` |
| `disabled`     | `disabled`     | `boolean`                        | `false`    |
| `readonly`     | `readonly`     | `boolean`                        | `false`    |
| `required`     | `required`     | `boolean`                        | `false`    |
| `icon`         | `icon`         | `string`                         | `''`       |
| `error`        | `error`        | `string`                         | `''`       |
| `clearable`    | `clearable`    | `boolean`                        | `true`     |
| `label`        | `label`        | `string`                         | `''`       |
| `autocomplete` | `autocomplete` | `string`                         | `''`       |
| `maxlength`    | `maxlength`    | `number`                         | —          |

| Method     | Description                  |
| ---------- | ---------------------------- |
| `focus()`  | Focuses the inner input      |
| `blur()`   | Blurs it                     |
| `select()` | Selects the field's contents |

| Event       | Detail              | Fired when                   |
| ----------- | ------------------- | ---------------------------- |
| `kt-input`  | `{ value: string }` | On every keystroke           |
| `kt-change` | `{ value: string }` | On commit (blur or Enter)    |
| `kt-clear`  | —                   | The clear button was pressed |

| Part      | Description           |
| --------- | --------------------- |
| `base`    | The field container   |
| `control` | The native `<input>`  |
| `actions` | The trailing icon row |
