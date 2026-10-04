# `<kt-tree>`

Things inside things — folders and files, an organisation's teams, nested pages
— as a tree to open and walk.

```html
<kt-tree label="Files"></kt-tree>

<script>
  const tree = document.querySelector('kt-tree');
  tree.items = [
    {
      id: 'src',
      label: 'src',
      icon: 'folder',
      children: [
        {
          id: 'components',
          label: 'components',
          icon: 'folder',
          children: [{ id: 'button', label: 'button.ts', icon: 'file' }],
        },
        { id: 'index', label: 'index.ts', icon: 'file' },
      ],
    },
    { id: 'readme', label: 'README.md', icon: 'file-text' },
  ];
  tree.expanded = ['src'];
  tree.addEventListener('kt-select', (event) => open(event.detail.id));
</script>
```

## Nodes

`items` is a list of `{ id, label, icon?, children? }`, as deep as it goes.
`expanded` lists the ids of the open nodes and `selected` the id of the chosen
one; both are yours to set, and the tree updates them as it is used.

A click on a node selects it and fires `kt-select`. A click on its chevron
opens or closes it and fires `kt-toggle` — so a folder can open without being
chosen. `toggle(id)` does the same from script.

## Keyboard

The WAI-ARIA tree view, one tab stop for the whole tree:

| Key          | Does                                                 |
| ------------ | ---------------------------------------------------- |
| Up, Down     | The previous or next visible node                    |
| Right        | Opens a closed node; on an open one, its first child |
| Left         | Closes an open node; on a closed one, its parent     |
| Home, End    | The first or last visible node                       |
| Enter, Space | Selects the node                                     |

## Accessibility

A `tree` named by `label`, each node a `treeitem` with its `aria-level`, its
place among its siblings (`aria-posinset`, `aria-setsize`), `aria-expanded`
when it has children and `aria-selected`. A screen reader says "src, expanded,
level 1, 1 of 2" — where the person is, not just what.

## API

| Property   | Attribute  | Type           | Default |
| ---------- | ---------- | -------------- | ------- |
| `items`    | —          | `KtTreeItem[]` | `[]`    |
| `expanded` | —          | `string[]`     | `[]`    |
| `selected` | `selected` | `string`       | `''`    |
| `label`    | `label`    | `string`       | `''`    |

| Method       | Description             |
| ------------ | ----------------------- |
| `toggle(id)` | Opens or closes a node. |

| Event       | Detail                              |
| ----------- | ----------------------------------- |
| `kt-select` | `{ id: string, item }`              |
| `kt-toggle` | `{ id: string, expanded: boolean }` |

| Part   | Description    |
| ------ | -------------- |
| `tree` | The tree       |
| `item` | One node's row |
