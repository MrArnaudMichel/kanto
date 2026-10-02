import { describe, expect, it } from 'vitest';
import { rankCommands } from '../../src/internal/command-search.js';
import { COMPONENTS } from './registry.js';
import { commandTarget, siteCommands } from './site-search.js';

const ROUTES = [
  { section: 'guide', slug: 'installation', label: 'Installation', group: 'Get started' },
  { section: 'guide', slug: 'appearance', label: 'Appearance', group: 'Design' },
  ...COMPONENTS.map((entry) => ({
    section: 'components',
    slug: entry.slug,
    label: entry.slug.replace(/^kt-/, ''),
    group: entry.group,
  })),
  { section: 'apps', slug: 'console-home', label: 'Console', group: 'Applications' },
];

const commands = siteCommands(ROUTES);
const find = (query: string) => rankCommands(commands, query).map((command) => command.id);

describe('the docs search', () => {
  it('has every page once, each leading to it', () => {
    const pages = commands.filter((command) => commandTarget(command.id)?.kind === 'page');
    expect(pages).toHaveLength(ROUTES.length);
    expect(commandTarget(pages[0]!.id)).toEqual({ kind: 'page', hash: '#/guide/installation' });
  });

  it('finds a component by its tag, its name, or what its page says it does', () => {
    expect(find('kt-table')[0]).toBe('page:#/components/kt-table');
    expect(find('date picker')[0]).toBe('page:#/components/kt-date-picker');
    expect(find('sorting')).toContain('page:#/components/kt-table');
  });

  it('runs the site actions: theme, accent, install command, GitHub', () => {
    expect(commandTarget(find('light theme')[0]!)).toEqual({ kind: 'theme', theme: 'light' });
    expect(commandTarget(find('teal')[0]!)).toEqual({ kind: 'accent', accent: 'teal' });
    expect(commandTarget(find('copy install')[0]!)).toEqual({ kind: 'copy-install' });
    expect(commandTarget(find('github')[0]!)).toEqual({ kind: 'github' });
  });

  it('reads nothing into an id it did not make', () => {
    expect(commandTarget('nonsense')).toBeNull();
  });
});
