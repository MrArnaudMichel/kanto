/**
 * "Open in StackBlitz": a real Vite project on the published package, wearing
 * the appearance chosen in the playground, running in the visitor's browser
 * a second later. No install, no account, and no dependency here: StackBlitz
 * takes a project as a plain form POST.
 */
import type { KtAppearance } from 'kanto-ds';
import { customAccent, htmlAttributes } from './snippet.js';

export interface StackBlitzProject {
  readonly title: string;
  readonly description: string;
  readonly template: 'node';
  readonly files: Record<string, string>;
}

const SCREEN = `  <body>
    <main class="app">
      <header class="app-header">
        <h1>Northwind</h1>
        <kt-button variant="primary" icon="plus">New invoice</kt-button>
      </header>

      <section class="stats">
        <kt-stat label="Revenue" value="$48,210" delta="+8.2%" trend="up"></kt-stat>
        <kt-stat label="Active users" value="2,914" delta="+3.1%" trend="up"></kt-stat>
      </section>

      <kt-card>
        <h6 slot="header">Workspace</h6>
        <form class="form">
          <kt-input label="Name" value="Northwind"></kt-input>
          <kt-select id="region" label="Region"></kt-select>
          <kt-toggle checked>Weekly digest</kt-toggle>
          <kt-button id="save" variant="primary">Save changes</kt-button>
        </form>
      </kt-card>

      <kt-table id="invoices" label="Invoices"></kt-table>
    </main>
    <kt-toast-container></kt-toast-container>
    <script type="module" src="/main.js"></script>
  </body>`;

const STYLES = `body {
  margin: 0;
  background: var(--surface-page);
  color: var(--text-body);
  font: var(--font-normal-regular);
}

.app {
  display: grid;
  gap: 24px;
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-header h1 {
  margin: 0;
  font: var(--font-title-h4);
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.form {
  display: grid;
  gap: 16px;
}
`;

/** The project for an appearance, on `version` of the package. */
export function stackblitzProject(
  appearance: Required<KtAppearance>,
  version: string,
): StackBlitzProject {
  const custom = customAccent(appearance);
  const main = [
    "import 'kanto-ds';",
    "import 'kanto-ds/styles.css';",
    custom
      ? "import { setAccent, toaster } from 'kanto-ds';"
      : "import { toaster } from 'kanto-ds';",
    "import './style.css';",
    '',
    ...(custom ? [`setAccent('${custom}');`, ''] : []),
    '// Data goes in as properties: anything that is not a string or a boolean.',
    "document.querySelector('#region').options = [",
    "  { id: 'eu', label: 'Europe' },",
    "  { id: 'us', label: 'United States' },",
    '];',
    '',
    "const invoices = document.querySelector('#invoices');",
    'invoices.columns = [',
    "  { key: 'customer', label: 'Customer' },",
    "  { key: 'amount', label: 'Amount' },",
    "  { key: 'status', label: 'Status' },",
    '];',
    'invoices.data = [',
    "  { id: 1, customer: 'Acme Corp', amount: '$1,200', status: 'Paid' },",
    "  { id: 2, customer: 'Globex', amount: '$860', status: 'Pending' },",
    "  { id: 3, customer: 'Initech', amount: '$2,430', status: 'Paid' },",
    '];',
    '',
    "document.querySelector('#save').addEventListener('click', () => toaster.success('Saved'));",
    '',
  ].join('\n');

  const html = `<!doctype html>
<html lang="en"${htmlAttributes(appearance)}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Kanto starter</title>
  </head>
${SCREEN}
</html>
`;

  const pkg = {
    name: 'kanto-starter',
    private: true,
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build' },
    // The minor, not the patch: the site deploys as a release is cut, and npm
    // can take a while to serve the newest patch to an install.
    dependencies: { 'kanto-ds': `^${version.split('.').slice(0, 2).join('.')}.0` },
    devDependencies: { vite: '^7.0.0' },
  };

  return {
    title: 'Kanto starter',
    description: 'A small screen built with Kanto, in your colours.',
    template: 'node',
    files: {
      'package.json': `${JSON.stringify(pkg, null, 2)}\n`,
      'index.html': html,
      'main.js': main,
      'style.css': STYLES,
    },
  };
}

/** Opens a project on StackBlitz in a new tab, through its form POST API. */
export function openInStackBlitz(project: StackBlitzProject, doc: Document = document): void {
  const form = doc.createElement('form');
  form.method = 'post';
  form.target = '_blank';
  form.action = 'https://stackblitz.com/run?file=index.html';
  form.hidden = true;
  const field = (name: string, value: string) => {
    const input = doc.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.append(input);
  };
  field('project[title]', project.title);
  field('project[description]', project.description);
  field('project[template]', project.template);
  for (const [path, content] of Object.entries(project.files)) {
    field(`project[files][${path}]`, content);
  }
  doc.body.append(form);
  form.submit();
  form.remove();
}
