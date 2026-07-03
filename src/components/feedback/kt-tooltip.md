# `<kt-tooltip>`

A short label that appears on hover or focus. Wrap what it describes:

```html
<kt-tooltip text="Actualiser les données">
  <kt-button icon="refresh-cw" label="Actualiser"></kt-button>
</kt-tooltip>
```

## A tooltip is a description, not a name

Note the `label` on the button above. A tooltip supplements a control; it must
never be the only thing naming it. A tooltip that has to be hovered to be read
leaves touch users and screen-reader users with an unlabelled button.

The rule: if the trigger has no visible text, it needs its own accessible name,
and the tooltip adds detail on top.

## How the description reaches the trigger

`aria-describedby` cannot cross a shadow boundary — an id inside this element's
shadow root is invisible to a trigger sitting in the light DOM.

So `<kt-tooltip>` also puts the text in a light-DOM node, addressed to a slot
that does not exist. That keeps it out of the rendered output while leaving it
referenceable: an explicit `aria-describedby` target is read even when it is not
displayed.

## Dismissal

Escape hides the tooltip while the trigger keeps focus, as WCAG 1.4.13 requires
of any content shown on hover or focus.

## API

| Property    | Attribute   | Type                                     | Default |
| ----------- | ----------- | ---------------------------------------- | ------- |
| `text`      | `text`      | `string`                                 | `''`    |
| `placement` | `placement` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` |
| `disabled`  | `disabled`  | `boolean`                                | `false` |

| Slot      | Description |
| --------- | ----------- |
| _default_ | The trigger |

| Part     | Description        |
| -------- | ------------------ |
| `bubble` | The tooltip bubble |
