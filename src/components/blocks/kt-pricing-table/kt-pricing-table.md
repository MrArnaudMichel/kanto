# `<kt-pricing-table>`

The plans, side by side: what each costs, what it includes, and the way in —
with a switch between monthly and yearly prices when the plans have both.

```html
<kt-pricing-table id="pricing" heading="Pricing" currency="EUR" yearly-note="Two months free">
  <a slot="note" href="/compare">Compare every feature</a>
</kt-pricing-table>
<script>
  pricing.plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: { monthly: 0, yearly: 0 },
      features: ['10 invoices a month'],
    },
    {
      id: 'team',
      name: 'Team',
      description: 'For a team that bills.',
      price: { monthly: 29, yearly: 290 },
      features: ['Unlimited invoices', 'Bank reconciliation'],
      featured: true,
      action: 'Start a trial',
    },
    {
      id: 'scale',
      name: 'Scale',
      price: 'Custom',
      features: ['SSO'],
      href: '/sales',
      action: 'Talk to sales',
    },
  ];
  pricing.addEventListener('kt-plan', (e) => checkout(e.detail.id, e.detail.billing));
</script>
```

## Plans

| Field         | What it is                                                                         |
| ------------- | ---------------------------------------------------------------------------------- |
| `id`          | What `kt-plan` carries.                                                            |
| `name`        | The plan's name, a heading.                                                        |
| `description` | Optional: who it is for.                                                           |
| `price`       | A number, formatted in `currency`; a string, as written; or `{ monthly, yearly }`. |
| `features`    | What it includes, a line each, ticked.                                             |
| `action`      | The button's words. Get started by default.                                        |
| `href`        | Makes the button a link; without it, the button fires `kt-plan`.                   |
| `featured`    | The plan to pick: outlined and badged.                                             |

## Billing

When a plan has a price per period, a switch shows over the plans, monthly
first. `billing` sets the period shown; changing it fires `kt-billing`. A
yearly price is the year's — `290` reads $290/year. `yearly-note` sits beside
the switch: what paying yearly saves.

Prices follow `locale`, the page's language when it is empty.

## Words

Every word is in `texts`, English until given others:

```js
pricing.texts = {
  monthly: 'Mensuel',
  yearly: 'Annuel',
  perMonth: '/mois',
  perYear: '/an',
  featured: 'Le plus choisi',
  action: 'Commencer',
};
```

## Accessibility

A section named by its heading, an `<h2>` by default (`heading-level`); the
plans are a list, each name one level under. The switch is a radio group,
one tab stop, moved with the arrows.

## API

| Property       | Attribute       | Type                           | Default     |
| -------------- | --------------- | ------------------------------ | ----------- |
| `heading`      | `heading`       | `string`                       | `''`        |
| `lead`         | `lead`          | `string`                       | `''`        |
| `plans`        | —               | `KtPlan[]`                     | `[]`        |
| `billing`      | `billing`       | `'monthly' \| 'yearly'`        | `'monthly'` |
| `currency`     | `currency`      | `string`                       | `'USD'`     |
| `locale`       | `locale`        | `string`                       | `''`        |
| `yearlyNote`   | `yearly-note`   | `string`                       | `''`        |
| `align`        | `align`         | `'center' \| 'start'`          | `'center'`  |
| `headingLevel` | `heading-level` | `number`                       | `2`         |
| `texts`        | —               | `Partial<KtPricingTableTexts>` | `{}`        |

| Event        | Detail            |
| ------------ | ----------------- |
| `kt-billing` | `{ billing }`     |
| `kt-plan`    | `{ id, billing }` |
