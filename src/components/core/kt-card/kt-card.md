# `<kt-card>`

The system's content surface: 12px radius, a 1px `--border-subtle` border, 24px
of padding, 20px between its rows. Transparent at rest — a card reads as a
grouping, not as an elevation.

```html
<kt-card>
  <h6 slot="header">Recent transactions</h6>
  <kt-table></kt-table>
  <kt-button slot="footer" variant="text">View full history</kt-button>
</kt-card>
```

Empty `header` and `footer` slots collapse, so an omitted footer costs no gap.

## Clickable cards

```html
<kt-card clickable>Entity 4812</kt-card>
```

`clickable` gives the card `role="button"`, a tab stop, hover and active
states, and Enter/Space activation, then fires `kt-card-click`. The
div-with-a-click-handler it replaces did none of that.

Do not nest interactive elements inside a clickable card — a button inside a
button is invalid, and the two hit targets fight. Either the card is the
control, or the things inside it are.

## Selected cards

`selected` marks a card as chosen — one filter of several, a picked plan:

```html
<kt-card clickable selected>Pending</kt-card>
```

It tints the card, outlines it in the primary colour and sets `aria-pressed`,
so the state is announced and not merely drawn.

Pair it with `clickable`. A card the user cannot toggle has no business looking
toggled, so a `selected` card that is not `clickable` gets the styling but no
`aria-pressed` — there is nothing to press, and claiming otherwise would be a
lie to a screen reader.

The outline lives on the card's own box rather than on the host element. An
outline only follows a `border-radius` declared on the same element, and the
host has none — put one on the host and you get sharp corners around a rounded
card.

## Media

`image` is the convenience path; the `media` slot takes anything else.

```html
<kt-card image="/preview.png" image-alt="Preview" image-position="top" image-size="160px"></kt-card>

<kt-card image-position="right" image-size="200px">
  <canvas slot="media"></canvas>
  Monthly breakdown
</kt-card>
```

`image-size` sets the width for `left`/`right` and the height for `top`/`bottom`.

## API

| Property        | Attribute        | Type                                     | Default   |
| --------------- | ---------------- | ---------------------------------------- | --------- |
| `clickable`     | `clickable`      | `boolean`                                | `false`   |
| `selected`      | `selected`       | `boolean`                                | `false`   |
| `image`         | `image`          | `string`                                 | `''`      |
| `imageAlt`      | `image-alt`      | `string`                                 | `''`      |
| `imagePosition` | `image-position` | `'left' \| 'right' \| 'top' \| 'bottom'` | `'left'`  |
| `imageSize`     | `image-size`     | `string`                                 | `'120px'` |

| Slot      | Description                    |
| --------- | ------------------------------ |
| _default_ | Card body                      |
| `header`  | Above the body                 |
| `footer`  | Below the body                 |
| `media`   | Replaces the `image` attribute |

| Event           | Detail | Fired when                                   |
| --------------- | ------ | -------------------------------------------- |
| `kt-card-click` | —      | A `clickable` card is activated. Cancelable. |

| Part    | Description                  |
| ------- | ---------------------------- |
| `base`  | The card container           |
| `media` | The image or media well      |
| `body`  | Header/content/footer column |
