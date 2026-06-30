# `<kt-segmented-control>`

A small set of mutually exclusive choices, drawn as one inset track with the
selected segment raised out of it.

```js
control.options = [
  { value: 'day', label: 'Jour' },
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Mois' },
];
control.value = 'week';
control.addEventListener('kt-change', (e) => setRange(e.detail.value));
```

Two to five options that all fit on screen — a view switch, a date range. Past
that, `<kt-select>`.

## Keyboard

It is a radio group, so the whole control is **one tab stop** and the arrows
move between segments — a five-option control does not add five stops to the
page.

| Key                  | Does                                    |
| -------------------- | --------------------------------------- |
| `←` / `→`            | Previous / next segment, and selects it |
| `↑` / `↓` (vertical) | Same, along the other axis              |
| `Home` / `End`       | First / last segment                    |

Arrows both move and select, which is standard radio-group behaviour. Disabled
segments are skipped, and the selection wraps at the ends.

## API

| Property      | Attribute     | Type                             | Default        |
| ------------- | ------------- | -------------------------------- | -------------- |
| `options`     | —             | `KtSegmentedOption[]`            | `[]`           |
| `value`       | `value`       | `string \| number \| null`       | `null`         |
| `size`        | `size`        | `'small' \| 'medium' \| 'large'` | `'medium'`     |
| `orientation` | `orientation` | `'horizontal' \| 'vertical'`     | `'horizontal'` |
| `disabled`    | `disabled`    | `boolean`                        | `false`        |
| `label`       | `label`       | `string`                         | `''`           |

```ts
interface KtSegmentedOption {
  value: string | number;
  label?: string; // omit with an icon for an icon-only segment
  icon?: string;
  disabled?: boolean;
}
```

| Event       | Detail                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| `kt-change` | `{ value, option }` — not fired when the active segment is re-selected |

| Part     | Description |
| -------- | ----------- |
| `base`   | The track   |
| `option` | A segment   |
