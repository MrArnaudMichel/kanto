# Northwind — a landing page on Kanto, in React

A product's marketing page: a hero, the companies that use it, features,
what people say, pricing, questions, a newsletter and the way in — every
section one of [Kanto](https://kanto.arnaudmichel.fr)'s blocks.

```bash
npm install
npm run dev
```

React 19 renders Kanto's elements natively; `kanto-ds/react/jsx` types them
(see `src/main.tsx`).

## Where things are

| To change            | Edit                                                |
| -------------------- | --------------------------------------------------- |
| Every word and price | `src/content.ts`                                    |
| The brand            | `src/brand.ts` — one `setAppearance` call           |
| Sign-up, newsletter  | `src/actions.ts` — call your app and email provider |
| The page             | `src/App.tsx`                                       |

## Components used

`kt-header`, `kt-hero`, `kt-logo-cloud`, `kt-feature-grid`,
`kt-testimonials`, `kt-pricing-table`, `kt-faq`, `kt-cta`, `kt-newsletter`,
`kt-footer`, `kt-button`. Each is documented at
https://kanto.arnaudmichel.fr/components.
