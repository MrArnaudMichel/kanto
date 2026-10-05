/** What create-kanto offers. A template here needs a `templates/<id>-<stack>/` for each stack. */
export const TEMPLATES = [
  { id: 'saas', label: 'SaaS app', hint: 'sign-in, dashboard, customers, settings' },
  {
    id: 'dashboard',
    label: 'Dashboard',
    hint: 'an admin console: inbox, customers, files, activity, nested settings, Cmd+K',
  },
  {
    id: 'editor',
    label: 'Editor',
    hint: 'documents in Markdown: a toolbar, a preview, autosave and versions',
  },
  {
    id: 'landing',
    label: 'Landing page',
    hint: "a product's marketing page, every section a block",
  },
  {
    id: 'chat',
    label: 'Chat',
    hint: 'an assistant: conversations, streamed answers, one function for the model',
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    hint: "a person's work, career, writing and a contact form",
  },
  {
    id: 'changelog',
    label: 'Changelog',
    hint: "a product's release notes: a filter, a page per release, email and RSS",
  },
];

export const STACKS = [
  { id: 'react', label: 'React' },
  { id: 'vue', label: 'Vue' },
  { id: 'vanilla', label: 'TypeScript, no framework' },
];
