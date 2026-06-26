# `<kt-drag-drop>`

A file drop zone. Takes a drop or a click, lists what was picked, and lets each
entry be removed.

```html
<kt-drag-drop accept="image/*" max-size="2097152" recommended-size="800×400px"></kt-drag-drop>
```

```js
zone.addEventListener('kt-files-change', (e) => console.log(e.detail.files));
zone.addEventListener('kt-files-rejected', (e) => {
  toast.error(e.detail.reason === 'size' ? 'Fichier trop volumineux' : 'Format non accepté');
});
```

The element holds the files and reports them. **Uploading is yours** — it makes
no requests.

## Validation

`accept` on a native input is advisory: the OS dialog filters by it, but a
_dropped_ file bypasses it completely. So `<kt-drag-drop>` re-checks every file
itself, by extension (`.pdf`), by mime prefix (`image/*`) or by exact type, and
fires `kt-files-rejected` with what it turned away and why.

`max-size` is in bytes and has no native equivalent at all.

## Accessibility

The zone is `role="button"` with a tab stop and Enter/Space activation, so it
can be used without a pointer — a drop zone reachable only by dragging is
unusable for anyone who does not drag. Each file's remove button carries the
file name in its accessible label, rather than nine identical "Supprimer"
buttons.

## API

| Property          | Attribute          | Type      | Default                    |
| ----------------- | ------------------ | --------- | -------------------------- |
| `heading`         | `heading`          | `string`  | `'Glissez-déposez ou'`     |
| `linkText`        | `link-text`        | `string`  | `'parcourez vos fichiers'` |
| `recommendedSize` | `recommended-size` | `string`  | `''`                       |
| `multiple`        | `multiple`         | `boolean` | `true`                     |
| `accept`          | `accept`           | `string`  | `''`                       |
| `maxSize`         | `max-size`         | `number`  | `0` (no limit)             |
| `disabled`        | `disabled`         | `boolean` | `false`                    |

`heading` rather than `title`: an element already has a `title`, and reusing it
would drop the prompt into a native tooltip over the whole zone.

| Getter          | Returns           |
| --------------- | ----------------- |
| `selectedFiles` | `readonly File[]` |

| Method    | Description                                    |
| --------- | ---------------------------------------------- |
| `clear()` | Empties the selection, fires `kt-files-change` |

| Event               | Detail                                        |
| ------------------- | --------------------------------------------- |
| `kt-files-change`   | `{ files: File[] }` — the full current list   |
| `kt-files-rejected` | `{ files: File[], reason: 'type' \| 'size' }` |

| Part   | Description          |
| ------ | -------------------- |
| `base` | The dashed drop zone |
| `list` | The list of files    |
