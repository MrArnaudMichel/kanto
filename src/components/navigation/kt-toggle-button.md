# `<kt-toggle-button>` / `<kt-toggle-button-group>`

A button that stays pressed, and a way to join several into one bar.

```html
<kt-toggle-button icon="bold" label="Bold"></kt-toggle-button>

<kt-toggle-button-group label="View">
  <kt-toggle-button value="list">List</kt-toggle-button>
  <kt-toggle-button value="grid">Grid</kt-toggle-button>
  <kt-toggle-button value="map">Map</kt-toggle-button>
</kt-toggle-button-group>
```

`aria-pressed`, not `aria-checked`: this is a control holding a state, not one
option among several. When they _are_ options among several, and only one may
be active, reach for `<kt-segmented-control>` instead — it has the right
semantics and the right keyboard model.

## The group owns the selection

Buttons are slotted rather than described by an options array, so a label can
be anything — an icon, a count, a chip.

Inside a group a button becomes **controlled**: it no longer flips itself and no
longer emits. The group reads the click, works out what the selection now is,
and writes `selected` back down. That is what keeps one press from producing two
different `kt-change` events.

So: listen on the group, not on its buttons.

```js
group.addEventListener('kt-change', (e) => {
  console.log(e.detail.value); // 'grid', or null
});
```

Single mode behaves like a radio group with a deselect — pressing the active
button clears it. `multiple` makes it a set of checkboxes drawn together, and
`value` becomes an array.

```html
<kt-toggle-button-group multiple orientation="vertical"></kt-toggle-button-group>
```

## API — `<kt-toggle-button>`

| Property       | Attribute       | Type                                    | Default     |
| -------------- | --------------- | --------------------------------------- | ----------- |
| `selected`     | `selected`      | `boolean`                               | `false`     |
| `disabled`     | `disabled`      | `boolean`                               | `false`     |
| `variant`      | `variant`       | `'primary' \| 'secondary' \| 'outline'` | `'primary'` |
| `size`         | `size`          | `'small' \| 'medium' \| 'large'`        | `'medium'`  |
| `value`        | `value`         | `string`                                | `''`        |
| `icon`         | `icon`          | `string`                                | `''`        |
| `iconPosition` | `icon-position` | `'left' \| 'right'`                     | `'left'`    |
| `label`        | `label`         | `string`                                | `''`        |

| Event       | Detail                                           |
| ----------- | ------------------------------------------------ |
| `kt-change` | `{ selected, value }` — not fired inside a group |

## API — `<kt-toggle-button-group>`

| Property      | Attribute     | Type                         | Default        |
| ------------- | ------------- | ---------------------------- | -------------- |
| `value`       | —             | `string \| string[] \| null` | `null`         |
| `multiple`    | `multiple`    | `boolean`                    | `false`        |
| `orientation` | `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `label`       | `label`       | `string`                     | `''`           |

| Event       | Detail      |
| ----------- | ----------- |
| `kt-change` | `{ value }` |
