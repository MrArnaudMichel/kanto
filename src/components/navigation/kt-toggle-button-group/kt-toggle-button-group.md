# `<kt-toggle-button-group>`

Joins `<kt-toggle-button>`s into one bar and owns their selection.

```html
<kt-toggle-button-group label="View">
  <kt-toggle-button value="list">List</kt-toggle-button>
  <kt-toggle-button value="grid">Grid</kt-toggle-button>
  <kt-toggle-button value="map">Map</kt-toggle-button>
</kt-toggle-button-group>
```

```js
group.addEventListener('kt-change', (e) => console.log(e.detail.value));
```

## The group owns the selection

Buttons are slotted rather than described by an options array, so a label can be
anything — an icon, a count, a chip.

Inside a group a button becomes **controlled**: it no longer flips itself and no
longer emits. The group reads the click, works out what the selection now is,
and writes `selected` back down. That is what keeps one press from producing two
contradictory `kt-change` events.

So: listen on the group, never on its buttons.

## Single and multiple

Single mode behaves like a radio group with a deselect — pressing the active
button clears it, and `value` is a string or `null`.

`multiple` makes it a set of checkboxes drawn together, and `value` becomes an
array.

```html
<kt-toggle-button-group multiple orientation="vertical"></kt-toggle-button-group>
```

Corner rounding belongs to the group, which is the only thing that knows which
button is first and which is last; it drives `--kt-toggle-button-radius` on each
child through CSS.

## API

| Property      | Attribute     | Type                         | Default        |
| ------------- | ------------- | ---------------------------- | -------------- |
| `value`       | —             | `string \| string[] \| null` | `null`         |
| `multiple`    | `multiple`    | `boolean`                    | `false`        |
| `orientation` | `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` |
| `label`       | `label`       | `string`                     | `''`           |

| Event       | Detail      |
| ----------- | ----------- |
| `kt-change` | `{ value }` |

| Slot      | Description                   |
| --------- | ----------------------------- |
| _default_ | `<kt-toggle-button>` children |

| Part   | Description         |
| ------ | ------------------- |
| `base` | The group container |

See [`<kt-toggle-button>`](../kt-toggle-button/kt-toggle-button.md) for the
button itself.
