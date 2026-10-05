# create-kanto

Start a project on [Kanto](https://kanto.arnaudmichel.fr): a SaaS app — sign
in, a first-run checklist, a dashboard, customers, settings — a product's
landing page, or a portfolio, in React, Vue or TypeScript without a framework.

```bash
npm create kanto@latest
```

Or say it all at once:

```bash
npm create kanto@latest my-app -- --template saas --stack react
```

| Option           | Values                         |
| ---------------- | ------------------------------ |
| `-t, --template` | `saas`, `landing`, `portfolio` |
| `-s, --stack`    | `react`, `vue`, `vanilla`      |
| `-y, --yes`      | the first choice for the rest  |

Each template is also in the repository, to fork as it is:
`npx degit MrArnaudMichel/kanto/templates/saas-react my-app`.
