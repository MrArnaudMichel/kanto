/**
 * The templates: each a project of its own, and what the stacks of one
 * template share — data, rules, view helpers — kept identical and tested once.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const root = process.cwd();
const dirs = readdirSync(join(root, 'templates'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version as string;
const [major, minor] = version.split('.');

/** Files every stack of a template carries unchanged. */
const SHARED = [
  'src/data/fixtures.ts',
  'src/data/api.ts',
  'src/auth.ts',
  'src/guard.ts',
  'src/content.ts',
  'src/format.ts',
  'src/view.ts',
  'src/brand.ts',
  'src/icons.ts',
  'src/styles.css',
];

const projects = dirs.filter((dir) => existsSync(join(root, 'templates', dir, 'package.json')));

describe('each template', () => {
  // Turned on by Task 5, once the three stacks are projects.
  it.todo('is a project for every stack of the SaaS template');

  // A loop, not it.each: until Task 3 there is no project, and that is fine.
  for (const dir of projects)
    it(`${dir} is a project of its own, asking for this minor of kanto-ds`, () => {
      const at = (file: string) => join(root, 'templates', dir, file);
      const pkg = JSON.parse(readFileSync(at('package.json'), 'utf8'));
      expect(pkg.private).toBe(true);
      expect(pkg.dependencies['kanto-ds']).toBe(`^${major}.${minor}.0`);
      expect(Object.keys(pkg.scripts)).toEqual(
        expect.arrayContaining(['dev', 'build', 'preview', 'typecheck']),
      );
      for (const file of ['README.md', '.gitignore', 'index.html', 'tsconfig.json']) {
        expect(existsSync(at(file)), `${dir}/${file}`).toBe(true);
      }
      expect(existsSync(at('package-lock.json')), `${dir} commits no lockfile`).toBe(false);
    });

  it.each(SHARED)('shares %s, unchanged, across the SaaS stacks', (file) => {
    const copies = ['saas-react', 'saas-vue', 'saas-vanilla'].map((dir) =>
      readFileSync(join(root, 'templates', dir, file), 'utf8'),
    );
    expect(copies[1], `saas-vue/${file}`).toBe(copies[0]);
    expect(copies[2], `saas-vanilla/${file}`).toBe(copies[0]);
  });
});

describe('the SaaS data', () => {
  it('finds customers by name, email or company, ignoring case', async () => {
    vi.useFakeTimers();
    const { listCustomers } = await import('../templates/saas-vanilla/src/data/api');
    const pending = listCustomers('KILN');
    await vi.runAllTimersAsync();
    const found = await pending;
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((customer) => customer.company === 'Kiln')).toBe(true);
    vi.useRealTimers();
  });

  it('turns the summary into four tiles, the overdue one inverted', async () => {
    vi.useFakeTimers();
    const { getSummary } = await import('../templates/saas-vanilla/src/data/api');
    const { summaryStats, revenueSeries } = await import('../templates/saas-vanilla/src/view');
    const pending = getSummary();
    await vi.runAllTimersAsync();
    const summary = await pending;
    const tiles = summaryStats(summary);
    expect(tiles.map((tile) => tile.key)).toEqual(['billed', 'paid', 'overdue', 'customers']);
    expect(tiles[0]!.delta).toMatch(/^[+-]\d+\.\d%$/);
    expect(tiles[2]!.inverted).toBe(true);
    expect(revenueSeries(summary).map((series) => series.values?.length)).toEqual([12, 12]);
    vi.useRealTimers();
  });
});

describe('signing in, and where a visit goes', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it('sends a visitor to sign in, and a signed-in person past it', async () => {
    const { redirectFor } = await import('../templates/saas-vanilla/src/guard');
    const { signIn, signOut } = await import('../templates/saas-vanilla/src/auth');
    expect(redirectFor('/settings', true)).toBe('/sign-in');
    expect(redirectFor('/sign-in', true)).toBeNull();
    expect(redirectFor('/nowhere', false)).toBeNull();
    await signIn({ email: 'ada@northwind.com', password: 'correct-horse' });
    expect(redirectFor('/sign-in', true)).toBe('/');
    expect(redirectFor('/settings', true)).toBeNull();
    signOut();
    expect(redirectFor('/', true)).toBe('/sign-in');
  });

  it('welcomes a new account before its dashboard, once', async () => {
    const { redirectFor } = await import('../templates/saas-vanilla/src/guard');
    const { markWelcomed, signUp } = await import('../templates/saas-vanilla/src/auth');
    await signUp({ name: 'Ada Park', email: 'ada@northwind.com', password: 'correct-horse' });
    expect(redirectFor('/', true)).toBe('/welcome');
    markWelcomed();
    expect(redirectFor('/', true)).toBeNull();
  });

  it('says what is missing, and still signs in when storage is blocked', async () => {
    const { currentSession, signIn } = await import('../templates/saas-vanilla/src/auth');
    await expect(signIn({ email: '', password: '' })).rejects.toThrow(/email and password/);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    await expect(signIn({ email: 'ada@northwind.com', password: 'x' })).resolves.toMatchObject({
      name: 'Ada',
    });
    expect(currentSession()).toMatchObject({ email: 'ada@northwind.com' });
  });
});
