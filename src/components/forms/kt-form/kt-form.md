# `<kt-form>`

A panel grouping related fields.

```html
<form>
  <kt-form heading="Identity" description="How we address you.">
    <kt-label-input label="Company" required>
      <kt-input name="company" required></kt-input>
    </kt-label-input>
    <kt-label-input label="Email address" required>
      <kt-input name="email" type="email" required></kt-input>
    </kt-label-input>

    <kt-button slot="footer" variant="dark" type="reset">Reset</kt-button>
    <kt-button slot="footer" type="submit">Save</kt-button>
  </kt-form>
</form>
```

## The surface

The panel sits on `--surface-form`, one step above the page. Fields inside are
filled at `--surface-field`, one step _below_ it — so they read as wells
recessed into the panel rather than as boxes floating on it. The relationship
survives the light theme, because both are roles rather than ramp steps.

## Put it inside your own `<form>`

This renders a `<fieldset>`, not a form, and that is deliberate.

Kanto fields are form-associated custom elements, and a control finds its form
by walking **its own tree**. A `<form>` inside this element's shadow root is not
an ancestor of anything slotted into it, so it would own nothing and
`new FormData(form)` would come back empty. The `<form>` above stays in charge
of submission, validation and reset; the panel owns the grouping and the look.

Several panels in one form is the usual shape:

```html
<form>
  <kt-form heading="Identity">…</kt-form>
  <kt-form heading="Subscription">…</kt-form>
  <kt-button type="submit">Save</kt-button>
</form>
```

## A fieldset, so the group has a name

The heading is the `<legend>`, which is what gives the group its accessible
name — a screen reader announces "Identity, group" as focus enters it. Without
a heading the legend stays in the accessibility tree but is visually hidden,
rather than being dropped.

## Disabling

`disabled` switches off every slotted control. A native `<fieldset disabled>`
does this for its descendants, but slotted fields are not descendants of the
fieldset in their own tree — the shadow boundary sits between them — so the
platform never reaches them and the panel walks them itself.

## Loading

`loading` draws placeholder fields in front of the real ones. The fields stay
mounted and keep their values, so a panel that reloads its options does not
throw away what the user already typed.

```html
<kt-form heading="Identity" loading loading-fields="4"></kt-form>
```

## API

| Property        | Attribute        | Type      | Default |
| --------------- | ---------------- | --------- | ------- |
| `heading`       | `heading`        | `string`  | `''`    |
| `description`   | `description`    | `string`  | `''`    |
| `loading`       | `loading`        | `boolean` | `false` |
| `loadingFields` | `loading-fields` | `number`  | `3`     |
| `disabled`      | `disabled`       | `boolean` | `false` |

| Slot      | Description                                  |
| --------- | -------------------------------------------- |
| _default_ | The fields                                   |
| `heading` | Replaces the `heading` attribute, for markup |
| `footer`  | Actions, right-aligned. Hidden when empty.   |

| Part     | Description      |
| -------- | ---------------- |
| `base`   | The `<fieldset>` |
| `header` | The description  |
| `fields` | The field column |
| `footer` | The action row   |
