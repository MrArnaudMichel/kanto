import { html, render, type TemplateResult } from 'lit';
import * as lucide from 'lucide';
import { registerIcons } from 'kanto-ds';
import 'kanto-ds';
import 'kanto-ds/styles.css';
import './shell.css';

import { foundationsPage } from './pages/foundations.js';
import { componentsPage } from './pages/components.js';
import { dashboardPage } from './pages/dashboard.js';
import { formPage } from './pages/form.js';
import { tablePage } from './pages/table.js';

// The docs use icons well beyond the seventeen the library ships. This is the
// "prototyping" registration the icon docs warn against in production.
registerIcons(lucide);

interface Page {
  readonly id: string;
  readonly label: string;
  readonly section: string;
  readonly render: () => TemplateResult;
}

const PAGES: readonly Page[] = [
  { id: 'foundations', label: 'Fondations', section: 'Design', render: foundationsPage },
  { id: 'components', label: 'Composants', section: 'Design', render: componentsPage },
  { id: 'dashboard', label: 'Tableau de bord', section: 'Exemples', render: dashboardPage },
  { id: 'form', label: 'Formulaire', section: 'Exemples', render: formPage },
  { id: 'table', label: 'Données', section: 'Exemples', render: tablePage },
];

const THEME_KEY = 'kanto-docs-theme';
type Theme = 'dark' | 'light';

function currentTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    // Private browsing, or storage blocked. The default theme is dark anyway.
    return 'dark';
  }
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset['theme'] = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* nothing to do: the page still renders in the chosen theme */
  }
}

/** The route is the fragment, so the site works from the file system. */
function currentPage(): Page {
  const id = location.hash.replace(/^#\/?/, '');
  return PAGES.find((page) => page.id === id) ?? PAGES[0]!;
}

function navSections() {
  const sections = [...new Set(PAGES.map((page) => page.section))];
  return sections.map((title) => ({
    title,
    items: PAGES.filter((page) => page.section === title).map((page) => ({
      label: page.label,
      href: `#${page.id}`,
    })),
  }));
}

function shell(): TemplateResult {
  const page = currentPage();
  const theme = currentTheme();

  return html`<div class="shell">
    <aside class="sidebar">
      <div class="wordmark">KANTO <span>DS</span></div>

      <kt-sub-menu-navigation
        .sections=${navSections()}
        active-href=${`#${page.id}`}
        label="Documentation Kanto"
      ></kt-sub-menu-navigation>

      <div class="sidebar-footer">
        <span class="overline">Thème</span>
        <kt-segmented-control
          label="Thème"
          .options=${[
            { value: 'dark', label: 'Sombre' },
            { value: 'light', label: 'Clair' },
          ]}
          .value=${theme}
          @kt-change=${(event: CustomEvent<{ value: Theme }>) => {
            applyTheme(event.detail.value);
            update();
          }}
        ></kt-segmented-control>
      </div>
    </aside>

    <main>${page.render()}</main>
  </div>`;
}

function update(): void {
  render(shell(), document.querySelector<HTMLElement>('#app')!);
}

applyTheme(currentTheme());
window.addEventListener('hashchange', update);
update();
