# Northwind — an operations console on Kanto, in TypeScript without a framework

An admin console to start from: an overview, a mailbox, customers, files, an
audit log, integrations and five settings screens, built from
[Kanto](https://kanto.arnaudmichel.fr)'s components.

```bash
npm install
npm run dev
```

Press Cmd+K (Ctrl+K) on any screen to jump to another.

## Where things are

| To change                     | Edit                                       |
| ----------------------------- | ------------------------------------------ |
| The brand                     | `src/brand.ts` — one `setAppearance` call  |
| The data                      | `src/data/api.ts` — call your backend here |
| The sidebar, routes, commands | `src/nav.ts`                               |
| A screen                      | `src/screens/`                             |
| The sidebar and top bar       | `src/shell.ts`                             |
| Filtering, sorting, paging    | `src/views.ts`                             |

Routes are hashes — `#/customers` — so the build runs on any static host.

## Components used

`kt-sub-menu-navigation`, `kt-command-palette`, `kt-kbd`, `kt-dropdown`,
`kt-page-header`, `kt-stat`, `kt-chart`, `kt-table`, `kt-select`,
`kt-multi-select`, `kt-side-panel`, `kt-confirm-dialog`, `kt-modal`, `kt-tabs`,
`kt-timeline`, `kt-toggle-button-group`, `kt-segmented-control`,
`kt-drag-drop`, `kt-form`, `kt-label-input`, `kt-input`, `kt-textarea`,
`kt-toggle`, `kt-alert`, `kt-card`, `kt-badge`, `kt-avatar`, `kt-icon`,
`kt-empty-state`, `kt-skeleton`, `kt-meter`, `kt-progress-bar`, `kt-tooltip`,
`kt-error-page`. Each is documented at
https://kanto.arnaudmichel.fr/components.
