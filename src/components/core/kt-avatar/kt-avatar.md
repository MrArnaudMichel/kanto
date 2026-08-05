# `<kt-avatar>`

A person or an organisation, as a picture or as their initials.

```html
<kt-avatar name="Benjamin Canac"></kt-avatar>
<kt-avatar name="Emma Davis" src="/emma.jpg" status="online"></kt-avatar>
<kt-avatar name="Kanto Studio" square size="large"></kt-avatar>
```

## The fallback is the main path

Most rows in most products have no photo, so the initials are what actually
renders. They are derived from the name — first and last word, or the first two
letters of a single word — and an email address is read as one, so
`emma.davis@example.com` becomes `ED`.

The colour is picked from the name, which means **the same person is the same
colour on every screen**. That is not decoration: it lets the eye find a row
before it has read it. Override it with `color` when the entity has a brand of
its own.

A photo that fails to load falls back to the initials rather than to a broken
image. Changing `src` clears that failure, so a retry is a property assignment.

## API

| Property | Attribute | Type                                        | Default    |
| -------- | --------- | ------------------------------------------- | ---------- |
| `name`   | `name`    | `string`                                    | `''`       |
| `src`    | `src`     | `string`                                    | `''`       |
| `size`   | `size`    | `'small' \| 'medium' \| 'large'`            | `'medium'` |
| `square` | `square`  | `boolean`                                   | `false`    |
| `status` | `status`  | `'online' \| 'away' \| 'busy' \| 'offline'` | —          |
| `color`  | `color`   | `string`                                    | `''`       |

Sizes are 24 / 32 / 48px, and everything inside scales from
`--kt-avatar-size`, so overriding that one property resizes the whole thing.

| Part    | Description |
| ------- | ----------- |
| `base`  | The circle  |
| `image` | The `<img>` |

`initialsOf(name)` is exported too, for the cases where you need the same
letters somewhere else.
