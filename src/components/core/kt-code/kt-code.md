# `<kt-code>`

A block of code on a recessed surface, with its language and a copy button.

```html
<kt-code language="js" copy>const total = items.length;</kt-code>
<kt-code>npm install kanto</kt-code>
```

Set neither `language` nor `copy` and the header disappears entirely — a bare
block for a one-line command.

## Highlighting is yours

The element owns the chrome — surface, language label, scrolling, copy — and
nothing else. Slot in whatever markup a highlighter produced:

```js
import hljs from 'highlight.js/lib/core';

block.innerHTML = hljs.highlight(source, { language: 'ts' }).value;
```

A design system that bundled a syntax highlighter would be choosing your bundle
size and your language set for you. This one does not, which is also why
`language` is purely a label: it says what the code is, it does not parse it.

Style the highlighter's classes from the token layer and they follow the theme:

```css
.hljs-keyword {
  color: var(--color-primary-base);
}
.hljs-string {
  color: var(--color-success-base);
}
.hljs-comment {
  color: var(--color-text-500);
}
```

## Against `<kt-badge variant="code">`

`<kt-badge variant="code">` is for a token inside a sentence — an identifier, a
property name, a custom property. `<kt-code>` is for a block. Both draw on
`--surface-code`, so they read as the same material at two scales.

## Copying

`copy` adds the button; pressing it writes `code` — the block's plain text, with
the leading and trailing newlines a template literal leaves behind removed — and
confirms for a second and a half.

A clipboard that refuses, because permission was denied or the page is not on a
secure origin, is swallowed: failing loudly over a convenience button helps
nobody. `kt-copy` fires either way, so a caller that cares can tell.

## Accessibility

The `<pre>` is a tab stop, because it scrolls: a block of code that can only be
scrolled with a pointer is unreadable without one. Give it a `label` when the
language alone does not say what it is.

## API

| Property   | Attribute  | Type      | Default |
| ---------- | ---------- | --------- | ------- |
| `language` | `language` | `string`  | `''`    |
| `copy`     | `copy`     | `boolean` | `false` |
| `label`    | `label`    | `string`  | `''`    |

| Getter | Returns                                        |
| ------ | ---------------------------------------------- |
| `code` | The block's plain text, trimmed of blank edges |

| Event     | Detail             |
| --------- | ------------------ |
| `kt-copy` | `{ code: string }` |

| Slot      | Description                                  |
| --------- | -------------------------------------------- |
| _default_ | The code — plain text, or highlighted markup |

| Part     | Description           |
| -------- | --------------------- |
| `base`   | The container         |
| `header` | The language row      |
| `pre`    | The scrolling `<pre>` |
