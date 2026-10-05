# Northwind — a landing page on Kanto, in Vue

A product's marketing page: a hero, the companies that use it, features,
what people say, pricing, questions, a newsletter and the way in — every
section one of [Kanto](https://kanto.arnaudmichel.fr)'s blocks.

```bash
npm install
npm run dev
```

Vue renders Kanto's elements natively; `vite.config.ts` tells its compiler
which tags they are.

## Where things are

| To change            | Edit                                             |
| -------------------- | ------------------------------------------------ |
| Every word and price | `src/content.ts`                                 |
| The brand            | `src/brand.ts` — one `setAppearance` call        |
| The newsletter       | `src/actions.ts` — call your email provider here |
| The page             | `src/App.vue`                                    |

## Components used

`kt-header`, `kt-hero`, `kt-logo-cloud`, `kt-feature-grid`,
`kt-testimonials`, `kt-pricing-table`, `kt-faq`, `kt-cta`, `kt-newsletter`,
`kt-footer`, `kt-button`. Each is documented at
https://kanto.arnaudmichel.fr/#/components.
