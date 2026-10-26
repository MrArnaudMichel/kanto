# Rowan Ellis — a portfolio on Kanto, in React

A person's site: an introduction, a few numbers, selected work to filter — each
project opening into a case study — a career, writing, and a contact form that
says what is missing before it sends. Built from
[Kanto](https://kanto.arnaudmichel.fr)'s components.

```bash
npm install
npm run dev
```

React 19 renders Kanto's elements natively; `kanto-ds/react/jsx` types them
(see `src/main.tsx`).

## Where things are

| To change              | Edit                                                      |
| ---------------------- | --------------------------------------------------------- |
| Everything it says     | `src/content.ts`                                          |
| The brand              | `src/brand.ts` — one `setAppearance` call                 |
| The form, the CV       | `src/actions.ts` — call your form service here            |
| The filter, the checks | `src/work.ts`                                             |
| The page               | `src/App.tsx`, `src/CaseStudy.tsx`, `src/ContactForm.tsx` |

## Components used

`kt-header`, `kt-avatar`, `kt-badge`, `kt-button`, `kt-stat`,
`kt-toggle-button-group`, `kt-card`, `kt-empty-state`, `kt-side-panel`,
`kt-timeline`, `kt-post-grid`, `kt-label-input`, `kt-input`, `kt-textarea`,
`kt-alert`, `kt-footer`. Each is documented at
https://kanto.arnaudmichel.fr/components.
