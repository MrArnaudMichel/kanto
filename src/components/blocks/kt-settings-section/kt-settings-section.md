# `<kt-settings-section>`

One part of a settings page: what it is about, the fields that change it, and
the button that saves them.

```html
<kt-settings-section heading="Profile" description="How others see you in the workspace.">
  <kt-label-input label="Name"><kt-input value="Ada Park"></kt-input></kt-label-input>
  <kt-label-input label="Email"
    ><kt-input type="email" value="ada@northwind.com"></kt-input
  ></kt-label-input>
  <span slot="note">Saved 2 minutes ago</span>
  <kt-button slot="actions">Save</kt-button>
</kt-settings-section>

<kt-settings-section
  danger
  heading="Delete workspace"
  description="Everything in it goes, for good."
>
  <kt-button slot="actions" variant="delete">Delete workspace</kt-button>
</kt-settings-section>
```

A settings page is several of these, one under another.

## Layout

`split`, the default, sets the heading and its description beside the fields
once the section is 760px wide — a third for the words, two thirds for the
card — and over them below. `stacked` always puts them over the fields.

## Slots

| Slot      | What goes in it                                      |
| --------- | ---------------------------------------------------- |
| (default) | The fields, spaced as a form.                        |
| `actions` | In the card's footer, at the end: Save, Cancel.      |
| `note`    | In the footer, at the start: when it was last saved. |

The footer shows only when it has actions or a note; a card with only actions
— a danger zone — is just its footer.

## Danger

`danger` turns the heading and the card's border red: the section that
deletes the workspace or the account. Pair it with a `delete` button and a
`kt-confirm-dialog`.

## Accessibility

A section named by its heading — an `<h2>` by default, `heading-level`
changes it — and described by its description. The section does not make a
form: wrap the page's sections in a `<form>` or a `<kt-form>`, or each one,
to save them together or apart.

## API

| Property       | Attribute       | Type                   | Default   |
| -------------- | --------------- | ---------------------- | --------- |
| `heading`      | `heading`       | `string`               | `''`      |
| `description`  | `description`   | `string`               | `''`      |
| `layout`       | `layout`        | `'split' \| 'stacked'` | `'split'` |
| `danger`       | `danger`        | `boolean`              | `false`   |
| `headingLevel` | `heading-level` | `number`               | `2`       |
