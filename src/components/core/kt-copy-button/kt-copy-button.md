# `<kt-copy-button>`

Copies a value to the clipboard and says it did: an API key, an install
command, a share link.

```html
<kt-copy-button value="npm install kanto-ds"></kt-copy-button>
<kt-copy-button value="sk_live_51H8…" icon-only label="Copy the API key"></kt-copy-button>
```

## Copying

A click — or `copy()` from script — writes `value` to the clipboard. It is
built on `kt-button`'s `run()`:

- on success the tick comes in and the label reads "Copied" for two seconds,
  announced to a screen reader; `kt-copy` fires with the value;
- if the browser refuses the clipboard — no permission, an insecure origin —
  the button shakes, `copy()` rejects, and nothing is said to have been copied.

## Options

`icon-only` draws the icon alone, named by `label`. `label` and `copied-label`
replace the translated "Copy" and "Copied" — "Copy the key", "Key copied".
`variant` and `size` are the button's own, `secondary` and `medium` by default.

## Accessibility

A real button, named by its words or, icon-only, by `label`. The confirmation
is announced through the button's status, so a person who cannot see the tick
still hears that it worked.

## API

| Property      | Attribute      | Type                             | Default       |
| ------------- | -------------- | -------------------------------- | ------------- |
| `value`       | `value`        | `string`                         | `''`          |
| `label`       | `label`        | `string`                         | `''`          |
| `copiedLabel` | `copied-label` | `string`                         | `''`          |
| `iconOnly`    | `icon-only`    | `boolean`                        | `false`       |
| `variant`     | `variant`      | `KtButtonVariant`                | `'secondary'` |
| `size`        | `size`         | `'small' \| 'medium' \| 'large'` | `'medium'`    |

| Method   | Description                                               |
| -------- | --------------------------------------------------------- |
| `copy()` | Copies `value`; resolves once copied, rejects if refused. |

| Event     | Detail              |
| --------- | ------------------- |
| `kt-copy` | `{ value: string }` |
