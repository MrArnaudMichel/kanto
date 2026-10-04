# `<kt-error-page>`

The page a person lands on when the one they wanted is not there: not found,
broken, or down for maintenance — said plainly, with the way on.

```html
<kt-error-page fill home-href="/app"></kt-error-page>
<kt-error-page kind="error">
  <span>Request id: 7f3a9c</span>
</kt-error-page>
<kt-error-page kind="maintenance"></kt-error-page>
```

## Kinds

| `kind`        | Code | Says                 | Offers                  |
| ------------- | ---- | -------------------- | ----------------------- |
| `not-found`   | 404  | Page not found       | Go home                 |
| `error`       | 500  | Something went wrong | Try again, then Go home |
| `maintenance` | 503  | Back in a moment     | Nothing it cannot do    |

`code` shows another code — 410, 403. `home-href` is where Go home leads, `/`
by default. Try again fires `kt-retry`; cancel it to retry your own way —
refetch the data, re-render the route — otherwise the page reloads.

The `actions` slot replaces the buttons — a search field, a link to the status
page — and the default slot goes under them, for a contact line or a request
id to quote to support.

## Layout and words

`fill` makes it take its container's height and centre itself in it, as a page
on its own. Every word is in `texts`, English until given others;
`heading-level` sets the heading's level, 1 by default.

```js
page.texts = { notFoundHeading: 'Page introuvable', goHome: "Retour à l'accueil" };
```

## Accessibility

The heading says what happened; the large code is decoration to a screen
reader, which hears the heading instead. Go home is a link, since it goes
somewhere; Try again is a button, since it does something.

## API

| Property       | Attribute       | Type                        | Default       |
| -------------- | --------------- | --------------------------- | ------------- |
| `kind`         | `kind`          | `KtErrorPageKind`           | `'not-found'` |
| `code`         | `code`          | `string`                    | `''`          |
| `homeHref`     | `home-href`     | `string`                    | `'/'`         |
| `headingLevel` | `heading-level` | `number`                    | `1`           |
| `fill`         | `fill`          | `boolean`                   | `false`       |
| `texts`        | —               | `Partial<KtErrorPageTexts>` | `{}`          |

| Event      | Detail                                       |
| ---------- | -------------------------------------------- |
| `kt-retry` | — Cancelable; uncancelled, the page reloads. |

| Slot      | Where                             |
| --------- | --------------------------------- |
| `actions` | Replaces the buttons              |
| _default_ | Under them: contact, a request id |
