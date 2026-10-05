/**
 * The templates: each a project of its own, and what the stacks of one
 * template share — data, rules, view helpers — kept identical and tested once.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { kantoRange } from './bump-templates.js';

const root = process.cwd();
const dirs = readdirSync(join(root, 'templates'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);
const version = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version as string;

/** Files every stack of a template carries unchanged. */
const SHARED: Record<string, readonly string[]> = {
  saas: [
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
    'src/latest.ts',
  ],
  landing: ['src/content.ts', 'src/actions.ts', 'src/brand.ts', 'src/styles.css'],
  portfolio: [
    'src/content.ts',
    'src/work.ts',
    'src/actions.ts',
    'src/brand.ts',
    'src/icons.ts',
    'src/styles.css',
  ],
  chat: [
    'src/content.ts',
    'src/conversations.ts',
    'src/model.ts',
    'src/brand.ts',
    'src/icons.ts',
    'src/styles.css',
  ],
};

const projects = dirs.filter((dir) => existsSync(join(root, 'templates', dir, 'package.json')));

describe('each template', () => {
  it('is a project for every stack of the SaaS template', () => {
    expect(projects).toEqual(expect.arrayContaining(['saas-react', 'saas-vue', 'saas-vanilla']));
  });

  // A loop, not it.each: until Task 3 there is no project, and that is fine.
  for (const dir of projects)
    it(`${dir} is a project of its own, asking for this minor of kanto-ds`, () => {
      const at = (file: string) => join(root, 'templates', dir, file);
      const pkg = JSON.parse(readFileSync(at('package.json'), 'utf8'));
      expect(pkg.private).toBe(true);
      // The range a release writes, so a prerelease's own check agrees with it.
      expect(pkg.dependencies['kanto-ds']).toBe(kantoRange(version));
      expect(Object.keys(pkg.scripts)).toEqual(
        expect.arrayContaining(['dev', 'build', 'preview', 'typecheck']),
      );
      for (const file of ['README.md', '.gitignore', 'index.html', 'tsconfig.json']) {
        expect(existsSync(at(file)), `${dir}/${file}`).toBe(true);
      }
      expect(existsSync(at('package-lock.json')), `${dir} commits no lockfile`).toBe(false);
    });

  for (const [template, files] of Object.entries(SHARED)) {
    it.each(files)(`shares %s, unchanged, across the ${template} stacks`, (file) => {
      const copies = ['react', 'vue', 'vanilla'].map((stack) =>
        readFileSync(join(root, 'templates', `${template}-${stack}`, file), 'utf8'),
      );
      expect(copies[1], `${template}-vue/${file}`).toBe(copies[0]);
      expect(copies[2], `${template}-vanilla/${file}`).toBe(copies[0]);
    });
  }
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

describe('latestOnly', () => {
  it('lets only the last call answer: an earlier one coming back late is stale', async () => {
    const { latestOnly } = await import('../templates/saas-vanilla/src/latest');
    const resolvers: ((value: string) => void)[] = [];
    const open = latestOnly(
      (id: string) => new Promise<string>((resolve) => resolvers.push(() => resolve(id))),
    );
    const first = open('A');
    const second = open('B');
    resolvers[1]!('B');
    resolvers[0]!('A');
    await expect(second).resolves.toEqual({ stale: false, value: 'B' });
    await expect(first).resolves.toEqual({ stale: true, value: 'A' });
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

describe('the landing content', () => {
  it('leads every plan, and every call to start, to the closing call to action', async () => {
    const { PRICING, HERO } = await import('../templates/landing-vanilla/src/content');
    expect(PRICING.plans.length).toBe(3);
    for (const plan of PRICING.plans) expect(plan.href, plan.id).toBe('#start');
    expect(HERO.primaryHref).toBe('#start');
  });

  it('draws each logo as an image named after its company', async () => {
    const { logoSrc } = await import('../templates/landing-vanilla/src/content');
    const src = logoSrc('Sato Ceramics');
    expect(src.startsWith('data:image/svg+xml,')).toBe(true);
    expect(decodeURIComponent(src)).toContain('Sato Ceramics');
    // A name the file's owner will type: an ampersand must not break the image.
    expect(decodeURIComponent(logoSrc('Smith & Sons'))).toContain('Smith &amp; Sons');
  });

  it('subscribes a new address, and says so for one already on the list', async () => {
    // It imports kanto-ds, which is slow to load under a busy suite: load it
    // before the clock is faked.
    const { subscribe } = await import('../templates/landing-vanilla/src/actions');
    vi.useFakeTimers();
    const ok = subscribe('ada@northwind.com');
    const taken = subscribe('already@example.com');
    const caught = taken.catch((error: Error) => error.message);
    await vi.runAllTimersAsync();
    await expect(ok).resolves.toBeUndefined();
    await expect(caught).resolves.toMatch(/on the list/);
    vi.useRealTimers();
  });
});

describe('the portfolio', () => {
  it('filters the work by tag, everything for All, nothing for a tag no project has', async () => {
    const { projectsTagged } = await import('../templates/portfolio-vanilla/src/work');
    const { PROJECTS } = await import('../templates/portfolio-vanilla/src/content');
    expect(projectsTagged('All')).toEqual(PROJECTS);
    const open = projectsTagged('Open source');
    expect(open.length).toBeGreaterThan(0);
    expect(open.every((project) => project.tags.includes('Open source'))).toBe(true);
    expect(projectsTagged('Pottery')).toEqual([]);
  });

  it('finds a project by its slug', async () => {
    const { projectBySlug } = await import('../templates/portfolio-vanilla/src/work');
    expect(projectBySlug('atlas')!.name).toBe('Atlas');
    expect(projectBySlug('nowhere')).toBeUndefined();
  });

  it('says what is missing or wrong in a message, field by field', async () => {
    const { validateMessage } = await import('../templates/portfolio-vanilla/src/work');
    expect(validateMessage({ name: '', email: '', message: '' })).toEqual({
      name: 'Enter your name.',
      email: 'Enter an email address, like name@example.com.',
      message: 'Say a word about what you are building.',
    });
    expect(validateMessage({ name: 'Ada', email: 'ada@', message: 'A dashboard.' })).toEqual({
      email: 'Enter an email address, like name@example.com.',
    });
    expect(validateMessage({ name: ' Ada ', email: 'ada@northwind.com', message: 'Hi.' })).toEqual(
      {},
    );
  });

  it('names no project Kanto', async () => {
    const { PROJECTS } = await import('../templates/portfolio-vanilla/src/content');
    expect(PROJECTS.some((project) => /kanto/i.test(project.name))).toBe(false);
  });
});

describe('the chat', () => {
  it('starts a conversation, titles it from its first question, and ignores a blank one', async () => {
    const { addQuestion, newConversation } =
      await import('../templates/chat-vanilla/src/conversations');
    const started = newConversation([]);
    expect(started.list[0]!.title).toBe('New chat');
    expect(addQuestion(started.list, started.id, '   ')).toBeNull();
    const asked = addQuestion(
      started.list,
      started.id,
      '  Why is revenue down 3% this month, and since when exactly?  ',
    )!;
    const conversation = asked.list.find((item) => item.id === started.id)!;
    expect(conversation.title).toBe('Why is revenue down 3% this month, and since…');
    expect(conversation.messages.map((message) => message.from)).toEqual(['user', 'assistant']);
    expect(conversation.messages[1]).toMatchObject({
      id: asked.replyId,
      text: '',
      streaming: true,
    });
    expect(started.list[0]!.messages).toEqual([]);
  });

  it('streams a reply into its own conversation, whichever is open', async () => {
    const { addQuestion, appendToken, finishReply, newConversation } =
      await import('../templates/chat-vanilla/src/conversations');
    const first = newConversation([]);
    const asked = addQuestion(first.list, first.id, 'Which regions are growing?')!;
    const second = newConversation(asked.list);
    let list = appendToken(second.list, first.id, asked.replyId, 'North ');
    list = appendToken(list, first.id, asked.replyId, 'East');
    list = finishReply(list, first.id, asked.replyId);
    const reply = list.find((item) => item.id === first.id)!.messages[1]!;
    expect(reply).toMatchObject({ text: 'North East', streaming: false });
    expect(list.find((item) => item.id === second.id)!.messages).toEqual([]);
  });

  it('answers by keyword, and streams the whole answer a token at a time', async () => {
    vi.useFakeTimers();
    const { answerFor, reply } = await import('../templates/chat-vanilla/src/model');
    const { FALLBACK } = await import('../templates/chat-vanilla/src/content');
    expect(answerFor('Why is REVENUE down?')).toMatch(/Revenue fell 3%/);
    expect(answerFor('Tell me a joke')).toBe(FALLBACK);
    const tokens: string[] = [];
    const done = reply('Which regions are growing?', (token) => tokens.push(token));
    await vi.runAllTimersAsync();
    await done;
    expect(tokens.length).toBeGreaterThan(5);
    expect(tokens.join('')).toBe(answerFor('Which regions are growing?'));
    vi.useRealTimers();
  });
});
