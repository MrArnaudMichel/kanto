# `<kt-tabs>`

An underlined tab bar.

```js
tabs.tabs = [
  { value: 'usage', label: 'Usage' },
  { value: 'api', label: 'API', icon: 'code' },
  { value: 'theme', label: 'Theme', disabled: true },
];
tabs.value = 'usage';
tabs.addEventListener('kt-change', (e) => show(e.detail.value));
```

## Against `<kt-segmented-control>`

They look similar in a screenshot and mean different things.

A **segmented control** picks a _value_ — a date range, a unit, a sort order —
and belongs inside a form or a toolbar. **Tabs** switch which _region of the
page_ you are looking at; they read as part of the page structure rather than
as a control sitting on it.

The shapes say so: an inset track with a raised pill, versus a rule with one
segment underlined. Using the wrong one is not a styling mistake, it is telling
the reader the wrong thing about what will happen.

## Panels

`<kt-tabs>` manages selection only — swapping the panel is yours, the same
contract as the segmented control. Give each tab a `panel` id and the tab
carries `aria-controls`, so the pairing is announced:

```html
<kt-tabs></kt-tabs>
<section id="usage-panel" role="tabpanel">…</section>
```

```js
tabs.tabs = [{ value: 'usage', label: 'Usage', panel: 'usage-panel' }];
```

## Loading

`loading` renders three placeholder tabs instead of the real ones, so a bar
waiting on a fetch reserves its height rather than appearing under the content
already on screen.

## Keyboard

One tab stop for the whole bar, as a tablist should have.

| Key            | Does                                |
| -------------- | ----------------------------------- |
| `←` / `→`      | Previous / next tab, and selects it |
| `Home` / `End` | First / last selectable tab         |

Disabled tabs are skipped, and selection wraps at both ends.

## API

| Property   | Attribute  | Type                       | Default |
| ---------- | ---------- | -------------------------- | ------- |
| `tabs`     | —          | `KtTab[]`                  | `[]`    |
| `value`    | `value`    | `string \| number \| null` | `null`  |
| `disabled` | `disabled` | `boolean`                  | `false` |
| `loading`  | `loading`  | `boolean`                  | `false` |
| `label`    | `label`    | `string`                   | `''`    |

```ts
interface KtTab {
  value: string | number;
  label?: string; // falls back to String(value)
  icon?: string; // Lucide name, kebab-case
  disabled?: boolean;
  panel?: string; // id of the region it controls
}
```

| Event       | Detail                                                            |
| ----------- | ----------------------------------------------------------------- |
| `kt-change` | `{ value, tab }` — not fired when the active tab is clicked again |

| Part   | Description |
| ------ | ----------- |
| `base` | The tablist |
| `tab`  | One tab     |
