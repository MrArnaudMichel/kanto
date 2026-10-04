# `<kt-chat-message>`

One message of a conversation with an assistant.

```html
<kt-chat-message from="user" name="Dana">What changed this week?</kt-chat-message>

<kt-chat-message name="Northwind AI" time="09:41" datetime="2026-10-04T09:41">
  <p>Revenue rose 12%, led by three new Team plans.</p>
  <kt-button slot="actions" size="small" variant="text" icon="copy">Copy</kt-button>
</kt-chat-message>
```

## Who wrote it

`from="assistant"`, the default, sets the reply beside its avatar as text on
the page: a reply is often long, and a bubble around paragraphs, lists and code
only crowds them. `from="user"` puts a person's message in a bubble on the far
side, short and clearly theirs.

`name` names the message for a screen reader and draws the avatar's initials;
`avatar` gives it a picture, and the `avatar` slot replaces it altogether — an
icon, a logo.

## Thinking and streaming

```html
<kt-chat-message name="Northwind AI" thinking></kt-chat-message>
<kt-chat-message name="Northwind AI" streaming>Revenue rose</kt-chat-message>
```

`thinking` shows three dots — and says "Thinking…" to a screen reader — in
place of the content, until the reply has a word of its own. `streaming` marks
the end of a reply still arriving with a caret. Both set `aria-busy` on the
message, and both hold still under reduced motion.

## Content

The message is the default slot. Render markdown into it as you would anywhere
else; the first and last child lose their outer margins so a paragraph sits
flush in the bubble.

## Accessibility

An `<article>` named by `name`. The time is a `<time>`, with `datetime` for the
machine-readable moment. Actions in the `actions` slot stay visible: a control
that appears only on hover cannot be reached by touch, and is hard to find from
the keyboard. Put the messages in a list or a log, and announce new ones from
there — a message cannot know it is the newest.

## API

| Property    | Attribute   | Type                    | Default       |
| ----------- | ----------- | ----------------------- | ------------- |
| `from`      | `from`      | `'assistant' \| 'user'` | `'assistant'` |
| `name`      | `name`      | `string`                | `''`          |
| `avatar`    | `avatar`    | `string`                | `''`          |
| `time`      | `time`      | `string`                | `''`          |
| `datetime`  | `datetime`  | `string`                | `''`          |
| `thinking`  | `thinking`  | `boolean`               | `false`       |
| `streaming` | `streaming` | `boolean`               | `false`       |

| Part      | Description         |
| --------- | ------------------- |
| `base`    | The `<article>`     |
| `bubble`  | A person's bubble   |
| `content` | The message         |
| `meta`    | The author and time |
