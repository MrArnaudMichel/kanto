# `<kt-accordion>`

A set of `kt-collapsible` sections that open one at a time: opening one folds
the one that was open, so the page stays the length of one answer.

```html
<kt-accordion>
  <kt-collapsible heading="Shipping">Three to five days, tracked.</kt-collapsible>
  <kt-collapsible heading="Returns">Thirty days, no questions.</kt-collapsible>
  <kt-collapsible heading="Warranty">Two years, parts and labour.</kt-collapsible>
</kt-accordion>
```

## One at a time, or each on its own

By default one section is open at most: opening another folds it, with the
collapsible's own animation. Of several opened in the markup, the first stays
open. `multiple` lets each section open and close on its own — the accordion
then only adds the keyboard.

`kt-change` reports the indexes of the open sections after each change.

## Keyboard

From a section's summary, the arrows move to the next or previous summary,
wrapping at the ends, and Home and End to the first and last — the WAI-ARIA
accordion pattern. Enter and Space open and close, as on any summary. Keys
inside a section's content are left to it.

## Accessibility

The sections stay `<details>`: each summary is a real control, announced as
expanded or collapsed, and find-in-page still opens a section to show a match.
The accordion adds the arrows; it adds no role, since a group of details needs
none.

## API

| Property   | Attribute  | Type      | Default |
| ---------- | ---------- | --------- | ------- |
| `multiple` | `multiple` | `boolean` | `false` |

| Getter     | Description                              |
| ---------- | ---------------------------------------- |
| `sections` | The `kt-collapsible` children, in order. |

| Event       | Detail               |
| ----------- | -------------------- |
| `kt-change` | `{ open: number[] }` |
