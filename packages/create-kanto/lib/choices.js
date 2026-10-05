/** What create-kanto offers. A template here needs a `templates/<id>-<stack>/` for each stack. */
export const TEMPLATES = [
  { id: 'saas', label: 'SaaS app', hint: 'sign-in, dashboard, customers, settings' },
  {
    id: 'landing',
    label: 'Landing page',
    hint: "a product's marketing page, every section a block",
  },
];

export const STACKS = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'vanilla', label: 'TypeScript, no framework' },
];
