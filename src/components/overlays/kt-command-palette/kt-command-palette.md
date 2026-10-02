# `<kt-command-palette>`

The palette a product opens on Cmd+K: every action and page, a few keystrokes away.

```html
<kt-command-palette></kt-command-palette>
```

```js
palette.commands = [
  { id: 'new-invoice', label: 'New invoice', group: 'Create', shortcut: 'mod i' },
  { id: 'new-customer', label: 'New customer', group: 'Create', keywords: ['client'] },
  { id: 'settings', label: 'Open settings', group: 'Navigate', icon: 'settings' },
  { id: 'export', label: 'Export as CSV', group: 'Actions', disabled: true },
];
palette.addEventListener('kt-select', (e) => run(e.detail.id));
```

## Opening it

Cmd+K on a Mac, Ctrl+K elsewhere, opens and closes it from anywhere on the
page — inside a field too, as people expect. `hotkey` sets another letter;
`hotkey=""` turns the shortcut off, for a page that opens it from a button of
its own (`palette.open = true`). Each opening starts from an empty search.

## Finding a command

Typing narrows the list. Every word typed must appear, in any order, in the
command's label, one of its `keywords` or its `group`, ignoring case and
accents — "client" finds New customer, "preferences" finds Préférences. What
remains ranks by how it matched:

1. a label that starts with the search;
2. a label in which each word starts a word;
3. a label that holds the search anywhere;
4. a match on a keyword or the group only.

Commands that tie keep the order you gave them, so the list reads the way you
wrote it. A disabled command stays listed — its absence would be a mystery —
and cannot be run.

## Keyboard

| Key          | Does                                                           |
| ------------ | -------------------------------------------------------------- |
| `↑` / `↓`    | the previous or next command, skipping disabled ones, wrapping |
| `Home`/`End` | the first or last command                                      |
| `Enter`      | runs the active command, and closes                            |
| `Escape`     | closes, and gives the focus back to where it was               |

A click runs a command too; a click outside the panel closes it.

## Commands

```ts
interface KtCommand {
  id: string;
  label: string;
  group?: string; // the heading it is listed under
  icon?: string; // a Lucide name
  keywords?: string[]; // other words it answers to
  shortcut?: string; // keys shown beside it, as <kt-kbd keys> takes them
  disabled?: boolean;
}
```

Groups appear in the order their first command does. A shortcut is only shown:
binding it is the application's work.

## API

| Property      | Attribute     | Type          | Default           |
| ------------- | ------------- | ------------- | ----------------- |
| `commands`    | —             | `KtCommand[]` | `[]`              |
| `open`        | `open`        | `boolean`     | `false`           |
| `hotkey`      | `hotkey`      | `string`      | `'k'`             |
| `placeholder` | `placeholder` | `string`      | from `setStrings` |

| Event       | Detail                               |
| ----------- | ------------------------------------ |
| `kt-select` | `{ id: string, command: KtCommand }` |
| `kt-open`   | —                                    |
| `kt-close`  | —                                    |

| Part     | Description        |
| -------- | ------------------ |
| `dialog` | The `<dialog>`     |
| `input`  | The search field   |
| `list`   | The scrolling list |
| `footer` | The keyboard hints |

## Accessibility

Built on the native `<dialog>`: the top layer, focus containment and the inert
page come from the platform. The field is a `combobox` over a `listbox`; the
active command is its `aria-activedescendant`, so a screen reader reads each
command as the arrows reach it, and each group is a `group` named by its
heading. The focus goes to the field on opening and back to where it was on
closing.
