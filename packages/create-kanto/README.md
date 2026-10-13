# create-kanto

Start a project on [Kanto](https://kanto.arnaudmichel.fr): a SaaS app — sign
in, a first-run checklist, a dashboard, customers, settings — an admin
console, a document editor, a product's landing page, an assistant, a portfolio or release notes, in React, Vue
or TypeScript without a framework.

```bash
npm create kanto@latest
```

Or say it all at once:

```bash
npm create kanto@latest my-app -- --template saas --stack react
```

| Option           | Values                                                                     |
| ---------------- | -------------------------------------------------------------------------- |
| `-t, --template` | `saas`, `dashboard`, `editor`, `landing`, `chat`, `portfolio`, `changelog` |
| `-s, --stack`    | `react`, `vue`, `vanilla`                                                  |
| `-y, --yes`      | the first choice for the rest                                              |

Each template is also in the repository, to fork as it is:
`npx degit MrArnaudMichel/kanto/templates/saas-react my-app`.

The `saas` template is the front end, its sign-in and data faked. For the
whole SaaS — real accounts, billing, an admin panel and your database — see
[Kanto SaaS Pro](https://kanto.arnaudmichel.fr/#/pro), a separate, paid
product.
