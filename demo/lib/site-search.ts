/**
 * The docs site's Cmd+K: every page — guides, components, apps, releases —
 * and the few things a visitor does to the site itself, as commands for the
 * library's own <kt-command-palette>.
 */
import { KT_ACCENTS, type KtCommand } from 'kanto-ds';
import { COMPONENTS } from './registry.js';

interface PageRoute {
  readonly section: string;
  readonly slug: string;
  readonly label: string;
  readonly group: string;
}

/** What running a command does. */
export type CommandTarget =
  | { kind: 'page'; hash: string }
  | { kind: 'theme'; theme: 'dark' | 'light' }
  | { kind: 'accent'; accent: string }
  | { kind: 'copy-install' }
  | { kind: 'github' };

const SECTIONS: Record<string, { title: string; icon: string }> = {
  home: { title: 'Pages', icon: 'house' },
  guide: { title: 'Guide', icon: 'book-open' },
  components: { title: 'Components', icon: 'component' },
  apps: { title: 'Apps', icon: 'app-window' },
  release: { title: 'Release', icon: 'tag' },
};

/** A component page's first paragraph: what it is for, to search by. */
function summaryOf(slug: string): string {
  const doc = COMPONENTS.find((entry) => entry.slug === slug)?.doc ?? '';
  return doc.split('\n\n')[1]?.replace(/\s+/g, ' ').trim() ?? '';
}

export function siteCommands(routes: readonly PageRoute[]): KtCommand[] {
  const pages = routes.map((route): KtCommand => {
    const section = SECTIONS[route.section] ?? { title: route.section, icon: 'file' };
    const component = route.section === 'components';
    return {
      id: `page:#/${route.section}/${route.slug}`,
      label: component ? `<${route.slug}>` : route.label,
      group: section.title,
      icon: section.icon,
      keywords: component
        ? [route.label, route.label.replace(/-/g, ' '), route.group, summaryOf(route.slug)]
        : [route.group],
    };
  });

  const actions: KtCommand[] = [
    { id: 'theme:dark', label: 'Switch to the dark theme', group: 'Site', icon: 'moon' },
    { id: 'theme:light', label: 'Switch to the light theme', group: 'Site', icon: 'sun' },
    ...KT_ACCENTS.map((accent): KtCommand => ({
      id: `accent:${accent.id}`,
      label: `Use the ${accent.label.toLowerCase()} accent`,
      group: 'Site',
      icon: 'palette',
      keywords: ['colour', 'color', 'theme'],
    })),
    {
      id: 'copy-install',
      label: 'Copy the install command',
      group: 'Site',
      icon: 'copy',
      keywords: ['npm', 'install'],
    },
    { id: 'github', label: 'Open the repository on GitHub', group: 'Site', icon: 'git-branch' },
  ];

  return [...pages, ...actions];
}

/** What a command id stands for; null for one this module did not make. */
export function commandTarget(id: string): CommandTarget | null {
  if (id.startsWith('page:')) return { kind: 'page', hash: id.slice('page:'.length) };
  if (id === 'theme:dark' || id === 'theme:light') {
    return { kind: 'theme', theme: id === 'theme:dark' ? 'dark' : 'light' };
  }
  if (id.startsWith('accent:')) return { kind: 'accent', accent: id.slice('accent:'.length) };
  if (id === 'copy-install') return { kind: 'copy-install' };
  if (id === 'github') return { kind: 'github' };
  return null;
}
