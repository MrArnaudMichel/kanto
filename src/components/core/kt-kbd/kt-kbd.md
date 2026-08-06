# `<kt-kbd>`

A keyboard shortcut, rendered per platform.

```html
<kt-kbd keys="mod k"></kt-kbd>
<kt-kbd keys="ctrl shift p"></kt-kbd>
<kt-kbd>/</kt-kbd>
```

`mod k` shows `⌘ K` on a Mac and `Ctrl K` everywhere else. A shortcut printed
with the wrong modifier is worse than no shortcut at all — the reader tries it,
nothing happens, and they stop trusting the hints.

## `mod` versus `meta`

Reach for **`mod`**: it means "the primary shortcut modifier", which is Command
on a Mac and Control elsewhere.

`meta` stays honest — on Windows the Meta key really is the Windows key, so that
is what it prints. Most design systems quietly map `meta` to Ctrl and are wrong
about it on one platform.

| Key                              | Mac         | Elsewhere               |
| -------------------------------- | ----------- | ----------------------- |
| `mod`                            | ⌘           | Ctrl                    |
| `meta`                           | ⌘           | Win                     |
| `ctrl`                           | ⌃           | Ctrl                    |
| `alt` / `option`                 | ⌥           | Alt                     |
| `shift`                          | ⇧           | Shift                   |
| `enter` / `escape` / `backspace` | ↵ / esc / ⌫ | Enter / Esc / Backspace |

Anything else is passed through uppercased.

## API

| Property   | Attribute  | Type                         | Default  |
| ---------- | ---------- | ---------------------------- | -------- |
| `keys`     | `keys`     | `string` (space-separated)   | `''`     |
| `platform` | `platform` | `'auto' \| 'mac' \| 'other'` | `'auto'` |

| Getter   | Returns                            |
| -------- | ---------------------------------- |
| `labels` | The keys as they will be displayed |
