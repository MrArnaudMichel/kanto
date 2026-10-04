# `<kt-faq>`

The questions people ask before they sign up, answered: an accordion under a
heading, one answer open at a time.

```html
<kt-faq id="faq" heading="Questions" layout="split">
  <span slot="note">Something else? <a href="/contact">Ask us</a>.</span>
</kt-faq>
<script>
  faq.items = [
    {
      question: 'Can I cancel any time?',
      answer: 'Yes, from Settings. You keep every invoice you sent.',
    },
    { question: 'Do you take card payments?', answer: 'Cards, bank transfers and direct debits.' },
  ];
</script>
```

## Questions

Each item is a `question` and its `answer`, drawn as a
`kt-collapsible` in a `kt-accordion`: opening one
folds the one that was open. `multiple` lets each open on its own;
`open-first` opens the first.

## Layout

`stacked`, the default, puts the head over the questions; `split` sets it at
the start, beside them, once the block is 880px wide — and holds it there
while the questions scroll (`--kt-faq-sticky-top`, 24px, clears a sticky
header). The `note` slot sits under the head: where to ask what is not
answered.

## Accessibility

A section named by its heading, an `<h2>` by default (`heading-level`). Each
question is a `<details>` summary — a real control, announced as expanded or
collapsed — and the arrows move between them. Find-in-page opens the answer
that holds a match.

## API

| Property       | Attribute       | Type                   | Default     |
| -------------- | --------------- | ---------------------- | ----------- |
| `heading`      | `heading`       | `string`               | `''`        |
| `lead`         | `lead`          | `string`               | `''`        |
| `items`        | —               | `KtFaqItem[]`          | `[]`        |
| `multiple`     | `multiple`      | `boolean`              | `false`     |
| `openFirst`    | `open-first`    | `boolean`              | `false`     |
| `layout`       | `layout`        | `'stacked' \| 'split'` | `'stacked'` |
| `align`        | `align`         | `'center' \| 'start'`  | `'center'`  |
| `headingLevel` | `heading-level` | `number`               | `2`         |
