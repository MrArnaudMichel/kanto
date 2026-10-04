# `<kt-newsletter>`

A way to hear from you again: a heading, a line, an email field and the
button that subscribes it.

```html
<kt-newsletter id="letter" heading="Notes, monthly" lead="What we shipped, and what we learned.">
  <span slot="note">One email a month. Unsubscribe in one click.</span>
</kt-newsletter>
<script>
  letter.addEventListener('kt-subscribe', (e) => e.detail.wait(api.subscribe(e.detail.email)));
</script>
```

## Subscribing

The button, or Enter in the field, checks the address first: one that is not
an address says so on the field, and nothing is sent. Then `kt-subscribe`
carries the `email` and `wait(promise)`:

- hand `wait` the request, and the button shows it running;
- when it resolves, the field gives way to a thanks, announced to screen
  readers, and `subscribed` is set;
- when it rejects, its message — or a plain one — shows on the field.

Without a `wait`, it thanks at once. `subscribe()` does what the button does.

## Variants and layout

`panel`, the default, sets it on a tinted panel; `plain` on the page.
`stacked` puts the field under the words; `inline` beside them, once the block
is 760px wide. On a narrow screen the button goes under the field.

## Words

```js
letter.texts = {
  email: 'Adresse e-mail',
  placeholder: 'vous@exemple.fr',
  subscribe: "S'abonner",
  invalid: 'Saisissez une adresse e-mail, comme nom@exemple.fr.',
  failed: "Ça n'est pas passé. Réessayez dans un instant.",
  done: 'C’est fait. Confirmez depuis votre boîte de réception.',
};
```

## Accessibility

A section named by its heading, an `<h2>` by default (`heading-level`). The
field is named — Email address — and asks for an email, so phones show the
right keyboard and browsers offer the reader's own. An error is said on the
field; the thanks sits in a status region, read out when it appears.

## API

| Property       | Attribute       | Type                         | Default     |
| -------------- | --------------- | ---------------------------- | ----------- |
| `heading`      | `heading`       | `string`                     | `''`        |
| `lead`         | `lead`          | `string`                     | `''`        |
| `variant`      | `variant`       | `'panel' \| 'plain'`         | `'panel'`   |
| `layout`       | `layout`        | `'stacked' \| 'inline'`      | `'stacked'` |
| `subscribed`   | `subscribed`    | `boolean`                    | `false`     |
| `align`        | `align`         | `'center' \| 'start'`        | `'center'`  |
| `headingLevel` | `heading-level` | `number`                     | `2`         |
| `texts`        | —               | `Partial<KtNewsletterTexts>` | `{}`        |

| Event          | Detail                     |
| -------------- | -------------------------- |
| `kt-subscribe` | `{ email, wait(promise) }` |
