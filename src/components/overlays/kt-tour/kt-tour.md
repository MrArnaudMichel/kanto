# `<kt-tour>`

A guided tour: a few steps, each pointing at a part of the page with a word
about it — a product's first run, a new feature.

```html
<kt-tour></kt-tour>

<script>
  const tour = document.querySelector('kt-tour');
  tour.steps = [
    {
      target: '#search',
      title: 'Search everything',
      body: 'Find any invoice or customer from here.',
    },
    { target: '#new-invoice', title: 'Send an invoice', body: 'Pick a customer and an amount.' },
    { title: 'You are set', body: 'Come back to this tour from the help menu.' },
  ];
  tour.start();
</script>
```

## Steps

Each step is `{ target?, title, body? }`. `target` is a CSS selector or the
element itself; the step lights it — the rest of the page dimmed around it —
scrolls it into view and sets the card beside it, never over it. A step with no
target, or one whose target is not on the page, centres its card instead.

The card shows the title, the words and where the tour is ("Step 2 of 3"), with
Previous from the second step, Next, and Done on the last.

## Running it

`start()` begins on the first step, `start(2)` on the third. `next()`,
`previous()` and `close()` do what the buttons do. Escape and the close button
end the tour early (`kt-close`); Done ends it at its end (`kt-finish`).
`kt-step` reports each step as it shows.

The light and the card are drawn in the top layer and follow the target as the
page scrolls or resizes.

## Accessibility

Each step's card is a dialog named by its title, and takes the focus as it
shows, so a screen reader reads the step and the keyboard is on its buttons.
The page stays usable: a tour points at things rather than taking them away, so
it does not trap the focus. "Step 2 of 3" and "Done" are translated through
`setStrings` as `stepOf` and `done`; Previous, Next and Close reuse the
existing strings.

## API

| Property | Attribute | Type           | Default |
| -------- | --------- | -------------- | ------- |
| `steps`  | —         | `KtTourStep[]` | `[]`    |

| Method          | Description                                      |
| --------------- | ------------------------------------------------ |
| `start(index?)` | Starts the tour, on step `index` (0 by default). |
| `next()`        | The next step, or the end after the last.        |
| `previous()`    | The step before.                                 |
| `close()`       | Ends the tour early.                             |

| Event       | Detail              |
| ----------- | ------------------- |
| `kt-step`   | `{ index: number }` |
| `kt-finish` | —                   |
| `kt-close`  | —                   |

| Part        | Description                 |
| ----------- | --------------------------- |
| `spotlight` | The light around the target |
| `card`      | The step's card             |
