# `<kt-toast>`

A transient notification.

For raising one, reach for [`toaster`](../kt-toast-container/kt-toast-container.md)
— this page is the element itself.

## Usage

```html
<kt-toast variant="warning" heading="Approaching your quota" dismissible duration="6000"></kt-toast>
```

`heading`, not `title`: every element already has a `title`, and shadowing it
would turn the toast into its own tooltip.

Errors are `role="alert"` / `aria-live="assertive"` and interrupt the screen
reader; everything else is `role="status"` / `polite` and waits its turn.

This is the only element in Kanto with a real shadow, and the only one that
blurs what is behind it. A toast floats above the page, so it says so.

## API

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
