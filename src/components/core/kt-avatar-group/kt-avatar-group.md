# `<kt-avatar-group>`

The people on something — a project's members, a document's editors — as
avatars overlapping in a row, the rest summed up as "+N".

```html
<kt-avatar-group label="Project members" max="3"></kt-avatar-group>

<script>
  document.querySelector('kt-avatar-group').people = [
    { name: 'Dana Whitfield' },
    { name: 'Hank Scorpio', src: '/hank.png' },
    { name: 'Bill Lumbergh' },
    { name: 'Gavin Belson' },
    { name: 'Alice Abernathy' },
  ];
</script>
```

## People

`people` is a list of `{ name, src? }`. Each becomes a `kt-avatar` — the
picture when there is one, the name's initials otherwise — overlapping the last
by a third, ringed in the page's colour so the stack reads as one.

`max` (4 by default) is how many are shown; the rest are summed up at the end
as "+N". `size` — `small`, `medium`, `large` — sizes them all, the sum
included.

## Accessibility

A list named by `label`, each avatar named by its person. The sum is said as
"2 more", not "plus two", and is translated through `setStrings` as
`moreCount`. When the people matter one by one, list them somewhere a person
can read every name — a tooltip on the group, or the members page it links to.

## API

| Property | Attribute | Type                             | Default    |
| -------- | --------- | -------------------------------- | ---------- |
| `people` | —         | `KtAvatarGroupPerson[]`          | `[]`       |
| `max`    | `max`     | `number`                         | `4`        |
| `size`   | `size`    | `'small' \| 'medium' \| 'large'` | `'medium'` |
| `label`  | `label`   | `string`                         | `''`       |

| Part   | Description         |
| ------ | ------------------- |
| `list` | The `<ul>`          |
| `more` | The "+N" at the end |
