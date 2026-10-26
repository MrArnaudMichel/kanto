# Northwind Docs — a document editor on Kanto, in React

A document editor to start from: documents in folders on the side, a page to
write in Markdown with a toolbar and a preview, autosave, and a version a
minute to go back to. Built from [Kanto](https://kanto.arnaudmichel.fr)'s
components.

```bash
npm install
npm run dev
```

## Where things are

| To change                 | Edit                                                 |
| ------------------------- | ---------------------------------------------------- |
| The brand                 | `src/brand.ts` — one `setAppearance` call            |
| Where documents are kept  | `src/store.ts` — this browser now; your backend next |
| The example documents     | `src/content.ts`                                     |
| Versions, titles, folders | `src/documents.ts`                                   |
| What the toolbar does     | `src/formatting.ts`                                  |
| How the preview is drawn  | `src/markdown.ts`                                    |
| The page and its shell    | `src/App.tsx`                                        |

Documents open at `#/doc/<id>`, so the build runs on any static host.

## Components used

`kt-app-shell`, `kt-tree`, `kt-button`, `kt-tooltip`, `kt-segmented-control`,
`kt-side-panel`, `kt-confirm-dialog`, `kt-empty-state`, `kt-error-page`,
`kt-toast`. Each is documented at https://kanto.arnaudmichel.fr/components.
