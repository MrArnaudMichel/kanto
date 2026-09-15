# `<kt-page-header>`

The block every screen opens with: an overline, a title, a sentence, and the
actions that belong to the page rather than to anything on it.

```html
<kt-page-header
  eyebrow="Dashboard"
  heading="Good evening"
  description="An overview of your workspace: recent files, integrations and activity."
>
  <kt-button slot="actions" variant="dark" icon="upload">Upload a file</kt-button>
  <kt-button slot="actions" icon="plus">New document</kt-button>
</kt-page-header>
```

It exists because it was being rebuilt on every screen, and the copies drifted:
different heading levels, different gaps, actions sometimes above the title and
sometimes beside it. None of those are decisions worth making twice.

## Two levels

`level="page"` (the default) renders an `<h1>` at display scale — one per
screen. `level="section"` renders an `<h2>` at body scale, for a region inside
a page, where the trailing action is usually a link onward rather than a button:

```html
<kt-page-header level="section" heading="Recently opened">
  <a slot="actions" href="#/files">See all files</a>
</kt-page-header>
```

Both wrap on a narrow screen: the actions drop under the copy rather than
squeezing the title.

## API

| Property      | Attribute     | Type                  | Default  |
| ------------- | ------------- | --------------------- | -------- |
| `eyebrow`     | `eyebrow`     | `string`              | `''`     |
| `heading`     | `heading`     | `string`              | `''`     |
| `description` | `description` | `string`              | `''`     |
| `level`       | `level`       | `'page' \| 'section'` | `'page'` |

| Slot      | Description                                 |
| --------- | ------------------------------------------- |
| _default_ | Extra content under the description         |
| `actions` | Buttons or a link, trailing on wide screens |

| Part      | Description         |
| --------- | ------------------- |
| `base`    | The container       |
| `heading` | The heading element |
