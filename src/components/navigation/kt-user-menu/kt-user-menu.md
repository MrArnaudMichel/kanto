# `<kt-user-menu>`

The account menu at the end of an application's header: the person's avatar,
and under it who is signed in and what they can do.

```html
<kt-user-menu name="Dana Whitfield" email="dana@northwind.io"></kt-user-menu>

<script>
  const menu = document.querySelector('kt-user-menu');
  menu.items = [
    { id: 'profile', label: 'Profile', icon: 'user' },
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'signout', label: 'Sign out', separator: true, danger: true },
  ];
  menu.addEventListener('kt-select', (event) => run(event.detail.id));
</script>
```

## The button

The avatar — `avatar` for a picture, initials from `name` otherwise — named
after the person. `show-name` writes the name beside it, for a header with the
room.

## The menu

The panel opens under the button, lined up with its end, in the top layer, so
no overflow clips it. It shows who is signed in — the avatar, `name` and
`email` — then the items.

Each item is `{ id, label, icon?, separator?, danger?, disabled? }`:
`separator` draws a rule above it, setting it apart from the items before;
`danger` draws it in the danger colour, for signing out or deleting. Choosing
one closes the menu and fires `kt-select` with its `id`. Anything slotted goes
under the items: a workspace switcher, a theme toggle, a plan badge.

## Keyboard

A menu button, as the WAI-ARIA pattern describes. Enter, Space or the down
arrow open it on the first item, the up arrow on the last. The arrows, Home and
End move between items, wrapping; Enter and Space choose. Escape closes it and
gives the focus back to the button; Tab and a click outside close it too.

## Accessibility

The button has `aria-haspopup="menu"` and `aria-expanded`; the list is a
`menu` named after the person, its items `menuitem`s, its rules `separator`s.
Who is signed in is shown above the menu rather than as an item, since it is
not something to choose.

## API

| Property   | Attribute   | Type               | Default |
| ---------- | ----------- | ------------------ | ------- |
| `name`     | `name`      | `string`           | `''`    |
| `email`    | `email`     | `string`           | `''`    |
| `avatar`   | `avatar`    | `string`           | `''`    |
| `items`    | —           | `KtUserMenuItem[]` | `[]`    |
| `showName` | `show-name` | `boolean`          | `false` |

| Method   | Description                                                       |
| -------- | ----------------------------------------------------------------- |
| `show()` | Opens the menu on its first item, or its last with `show('end')`. |
| `hide()` | Closes it, giving the focus back to the button.                   |

| Event       | Detail                 |
| ----------- | ---------------------- |
| `kt-select` | `{ id: string, item }` |
| `kt-open`   | —                      |
| `kt-close`  | —                      |

| Part      | Description      |
| --------- | ---------------- |
| `trigger` | The button       |
| `panel`   | The menu's panel |
| `item`    | One item         |
