# `<kt-empty-page>`

The page a new account lands on, before there is anything in it: a welcome,
and the first steps that fill it — what is done, what is next, and the way to
each.

```html
<kt-empty-page id="welcome" heading="Welcome, Ada" lead="Three steps and you are sending invoices.">
  <a slot="actions" href="/app">Skip for now</a>
</kt-empty-page>
<script>
  welcome.steps = [
    {
      id: 'company',
      title: 'Add your company',
      description: 'Name, address and logo.',
      done: true,
    },
    {
      id: 'customer',
      title: 'Add a customer',
      description: 'Who you bill.',
      action: 'Add customer',
    },
    {
      id: 'invoice',
      title: 'Send your first invoice',
      action: 'New invoice',
      href: '/invoices/new',
    },
  ];
  welcome.addEventListener('kt-step', (e) => open(e.detail.id));
</script>
```

For a list or a panel with nothing in it, `kt-empty-state`; this is the whole
page, the first time.

## Steps

| Field         | What it is                                                      |
| ------------- | --------------------------------------------------------------- |
| `id`          | What `kt-step` carries.                                         |
| `title`       | The step, said as something to do.                              |
| `description` | Optional: what it needs, or why.                                |
| `action`      | Optional: the button's words. Start by default.                 |
| `href`        | Optional: makes the action a link; without it, `kt-step` fires. |
| `done`        | The step is taken: ticked, struck through, no action.           |

The steps are numbered in order, with how far along it is over them — 1 of 3
done. The first step not done is the next one: its action is the primary
button, the others are secondary. On a narrow screen the action goes under its
step's words.

## Slots

| Slot      | What goes in it                            |
| --------- | ------------------------------------------ |
| `media`   | Over the heading: an illustration, a logo. |
| `actions` | Under the steps: Skip for now, the docs.   |

## Words

```js
welcome.texts = {
  progress: (done, total) => `${done} sur ${total} faits`,
  done: 'Fait :',
  start: 'Commencer',
};
```

## Accessibility

A section named by its heading — an `<h1>`, since it is the page;
`heading-level` changes it. The steps are an ordered list, each title one
level under. A done step's title is read with "Done:" before it, since the
tick and the line through are only seen. The progress bar is named with the
same words it shows.

## API

| Property       | Attribute       | Type                        | Default |
| -------------- | --------------- | --------------------------- | ------- |
| `heading`      | `heading`       | `string`                    | `''`    |
| `lead`         | `lead`          | `string`                    | `''`    |
| `steps`        | —               | `KtFirstStep[]`             | `[]`    |
| `headingLevel` | `heading-level` | `number`                    | `1`     |
| `texts`        | —               | `Partial<KtEmptyPageTexts>` | `{}`    |

| Event     | Detail   |
| --------- | -------- |
| `kt-step` | `{ id }` |
