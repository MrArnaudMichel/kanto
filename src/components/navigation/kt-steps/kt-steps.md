# `<kt-steps>`

The steps of a flow — sign-up, checkout, onboarding — and where the reader is in it.

```html
<kt-steps label="Sign-up" current="billing"></kt-steps>
```

```js
steps.steps = [
  { id: 'account', label: 'Account' },
  { id: 'billing', label: 'Billing', description: 'Card or invoice' },
  { id: 'team', label: 'Team' },
  { id: 'done', label: 'Done' },
];
```

## States

Steps before `current` are complete and show a tick; `current` is ringed; the
rest are to come, numbered. A step with `error: true` shows an alert in the
danger colour wherever it sits — a field it holds failed on submit — so the
reader knows where to go back to.

Each state is also said in words for a screen reader — "Completed", "Current
step", "Not started", "Needs attention" — from `setStrings`.

## Going back

With `navigable`, every completed step is a button: picking one sets
`current` to it and fires `kt-change`. Steps ahead are never buttons: a flow
moves forward by its own Next button, once what the current step asks for is
done.

```html
<kt-steps label="Checkout" current="payment" navigable></kt-steps>
```

## Orientation

Across by default, the steps sharing the width with a connector between them.
`orientation="vertical"` stacks them down a rail — for a side column, or for
steps with long descriptions.

## API

| Property      | Attribute     | Type                         | Default        |
| ------------- | ------------- | ---------------------------- | -------------- |
| `steps`       | —             | `KtStep[]`                   | `[]`           |
| `current`     | `current`     | `string`                     | `''`           |
| `label`       | `label`       | `string`                     | `''`           |
| `orientation` | `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `navigable`   | `navigable`   | `boolean`                    | `false`        |

```ts
interface KtStep {
  id: string;
  label: string;
  description?: string;
  error?: boolean;
}
```

| Event       | Detail           |
| ----------- | ---------------- |
| `kt-change` | `{ id: string }` |

| Part        | Description                      |
| ----------- | -------------------------------- |
| `list`      | The `<ol>`                       |
| `step`      | A step                           |
| `marker`    | A step's number, tick or alert   |
| `connector` | The line from a step to the next |

## Accessibility

An ordered list named by `label`: the number is each step's place.
`aria-current="step"` marks the current one, and each state is said in words,
not only shown in colour.
