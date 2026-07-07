# `<kt-toast>` / `<kt-toast-container>` / `toaster`

Transient notifications. Three layers, use the highest one that fits.

## `toaster` — the usual way

```js
import { toaster } from 'kanto';

toaster.success('Entité créée');
toaster.error('Échec de la sauvegarde', { description: 'Réessayez dans un instant.' });
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
container.show({ variant: 'success', heading: 'Entité créée', duration: 4000 });
```

The container owns the toasts: it appends them, and it removes them when they
ask to go. A toast that removes itself from a list it does not own is how you
end up with two of them and neither disappearing.

Newest toasts stack towards the screen edge, so the newest is always nearest
the corner. Past `limit`, the oldest is dropped.

**Hovering the stack pauses every countdown**, and leaving it resumes them —
otherwise a toast expires under the pointer of someone reading it.

## `<kt-toast>` — one notification

```html
<kt-toast variant="warning" heading="Quota bientôt atteint" dismissible duration="6000"></kt-toast>
```

`heading`, not `title`: every element already has a `title`, and shadowing it
would turn the toast into its own tooltip.

Errors are `role="alert"` / `aria-live="assertive"` and interrupt the screen
reader; everything else is `role="status"` / `polite` and waits its turn.

This is the only element in Kanto with a real shadow, and the only one that
blurs what is behind it. A toast floats above the page, so it says so.

## API — `<kt-toast>`

| Property      | Attribute     | Type                                                 | Default         |
| ------------- | ------------- | ---------------------------------------------------- | --------------- |
| `variant`     | `variant`     | `'success' \| 'information' \| 'warning' \| 'error'` | `'information'` |
| `heading`     | `heading`     | `string`                                             | `''`            |
| `description` | `description` | `string`                                             | `''`            |
| `dismissible` | `dismissible` | `boolean`                                            | `false`         |
| `duration`    | `duration`    | `number` (ms, 0 = stays)                             | `0`             |

| Method     | Description                 |
| ---------- | --------------------------- |
| `close()`  | Fires `kt-toast-close`      |
| `pause()`  | Freezes the countdown       |
| `resume()` | Resumes it where it stopped |

| Event            | Fired when                   |
| ---------------- | ---------------------------- |
| `kt-toast-close` | The toast asks to be removed |

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
