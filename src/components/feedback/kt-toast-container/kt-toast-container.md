# `<kt-toast-container>` / `toaster`

The stack that owns the toasts on screen, and the imperative shortcut to it.

## `toaster` — the usual way

```js
import { toaster } from 'kanto-ds';

toaster.success('Entity created');
toaster.error('Could not save', { description: 'Try again in a moment.' });
```

It creates one `<kt-toast-container>` on `<body>` the first time it is called
and reuses it — including one you already put in your own markup, which it
adopts rather than duplicating.

Defaults that encode the intent: success and info dismiss after 4s, warnings
after 6s, and **errors never dismiss themselves**. An error the user did not
happen to be looking at is an error they never saw.

## `<kt-toast-container>` — when placement matters

```html
<kt-toast-container position="top-right" limit="3"></kt-toast-container>
```

```js
container.show({ variant: 'success', heading: 'Entity created', duration: 4000 });
```

The container owns the toasts: it appends them, and removes them when they ask
to go. A toast that removes itself from a list it does not own is how you end up
with two on screen and neither leaving.

Newest toasts stack towards the screen edge, so the newest is always nearest the
corner. Past `limit`, the oldest is dropped.

**Hovering the stack pauses every countdown**, and leaving it resumes them —
otherwise a toast expires under the pointer of someone reading it.

The container itself does not intercept pointer events; only the toasts inside
it do, so the rest of the corner stays clickable.

## API — `<kt-toast-container>`

| Property   | Attribute  | Type                                                           | Default          |
| ---------- | ---------- | -------------------------------------------------------------- | ---------------- |
| `position` | `position` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'bottom-right'` |
| `limit`    | `limit`    | `number`                                                       | `5`              |

| Method / getter  | Description                   |
| ---------------- | ----------------------------- |
| `show(options)`  | Raises a toast, returns it    |
| `dismiss(toast)` | Removes one                   |
| `clear()`        | Removes all                   |
| `toasts`         | Those on screen, oldest first |

## API — `toaster`

| Member                                          | Description                          |
| ----------------------------------------------- | ------------------------------------ |
| `success/info/warning/error(heading, options?)` | Raises a toast, returns it           |
| `show(options)`                                 | The general form                     |
| `getContainer()`                                | The container, creating it if needed |
| `clear()`                                       | Clears the stack                     |
| `position`                                      | Where an auto-created container sits |

See [`<kt-toast>`](../kt-toast/kt-toast.md) for a single notification.
