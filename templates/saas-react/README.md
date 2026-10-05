# Northwind — a SaaS app on Kanto, in React

An invoicing app to start from: sign in, a first-run checklist, a dashboard,
customers and settings, built from [Kanto](https://kanto.arnaudmichel.fr)'s
components and blocks.

```bash
npm install
npm run dev
```

React 19 renders Kanto's elements natively; `kanto-ds/react/jsx` types them
(see `src/main.tsx`).

Any email and password sign in: the auth is fake, in `src/auth.ts`.

## Where things are

| To change            | Edit                                         |
| -------------------- | -------------------------------------------- |
| The brand            | `src/brand.ts` — one `setAppearance` call    |
| The data             | `src/data/api.ts` — call your backend here   |
| Signing in           | `src/auth.ts` — call your auth provider here |
| The navigation, menu | `src/content.ts`                             |
| A page               | `src/pages/`                                 |
| The routes           | `src/router.tsx` (react-router)              |

Routes are hashes — `#/customers` — so the build runs on any static host.

## Components used

`kt-app-shell`, `kt-sub-menu-navigation`, `kt-user-menu`, `kt-auth-form`,
`kt-empty-page`, `kt-page-header`, `kt-stat`, `kt-chart`, `kt-table`,
`kt-input`, `kt-side-panel`, `kt-description-list`, `kt-settings-section`,
`kt-toggle`, `kt-button`, `kt-confirm-dialog`, `kt-error-page`. Each is
documented at https://kanto.arnaudmichel.fr/#/components.
