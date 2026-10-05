/**
 * The templates: each a project of its own, and what the stacks of one
 * template share — data, rules, view helpers — kept identical and tested once.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { KtNavItem, KtNavSection } from '../src/index.js';
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
  dashboard: [
    'src/data/generate.ts',
    'src/data/fixtures.ts',
    'src/data/api.ts',
    'src/nav.ts',
    'src/views.ts',
    'src/cells.ts',
    'src/format.ts',
    'src/brand.ts',
    'src/icons.ts',
    'src/styles.css',
  ],
  editor: [
    'src/content.ts',
    'src/documents.ts',
    'src/markdown.ts',
    'src/formatting.ts',
    'src/store.ts',
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
  // The actions import kanto-ds, slow to load under a busy suite: load them
  // once, with time to spare, so no test times out while its body runs on.
  beforeAll(() => import('../templates/landing-vanilla/src/actions'), 30_000);

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
    const { answerFor, reply } = await import('../templates/chat-vanilla/src/model');
    const { FALLBACK } = await import('../templates/chat-vanilla/src/content');
    vi.useFakeTimers();
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

describe('the dashboard', () => {
  it('has a command and a sidebar link for every route, and a route for every link', async () => {
    const { COMMANDS, NAV, ROUTES } = await import('../templates/dashboard-vanilla/src/nav');
    const paths = ROUTES.map((route) => route.path);
    expect(paths).toHaveLength(11);
    expect(new Set(paths).size).toBe(11);
    expect(COMMANDS.map((command) => command.id).sort()).toEqual([...paths].sort());
    const hrefs: string[] = [];
    const walk = (items: readonly KtNavItem[]) => {
      for (const item of items) {
        if (item.href) hrefs.push(item.href.replace(/^#/, ''));
        if (item.children) walk(item.children);
      }
    };
    for (const section of NAV) walk(section.items);
    expect(hrefs.sort()).toEqual([...paths].sort());
  });

  it('reaches the members screens three levels down, and names every route', async () => {
    const { NAV, ROUTES, navWithUnread, routeFor, titleFor } =
      await import('../templates/dashboard-vanilla/src/nav');
    const admin = NAV.find((section) => section.title === 'Administration')!;
    const settings = admin.items.find((item) => item.label === 'Settings')!;
    const members = settings.children!.find((item) => item.label === 'Members')!;
    expect(members.children!.map((item) => item.href)).toEqual([
      '#/settings/members/people',
      '#/settings/members/roles',
    ]);
    expect(routeFor('/settings/members/roles')?.screen).toBe('roles');
    expect(routeFor('/nowhere')).toBeUndefined();
    for (const route of ROUTES) expect(titleFor(route.path)).not.toBe('Not found');

    // The unread count sits beside Inbox, and goes when there is none.
    const badge = (sections: readonly KtNavSection[]) =>
      sections[0]!.items.find((item) => item.href === '#/inbox')!.badge;
    expect(badge(navWithUnread(3))).toBe('3');
    expect(badge(navWithUnread(0))).toBeUndefined();
  });

  it('serves the same customers every time, and forgets the deleted ones', async () => {
    vi.useFakeTimers();
    const { deleteCustomers, listCustomers } =
      await import('../templates/dashboard-vanilla/src/data/api');
    const first = listCustomers();
    const second = listCustomers();
    await vi.runAllTimersAsync();
    const all = await first;
    expect(all.length).toBeGreaterThan(50);
    expect(all).toEqual(await second);
    const doomed = [all[0]!.id, all[1]!.id];
    const gone = deleteCustomers(doomed);
    await vi.runAllTimersAsync();
    await gone;
    const after = listCustomers();
    await vi.runAllTimersAsync();
    const left = await after;
    expect(left.map((row) => row.id)).not.toContain(doomed[0]);
    expect(left).toHaveLength(all.length - 2);
    vi.useRealTimers();
  });

  it('filters, then sorts every customer, then cuts the page', async () => {
    const { buildEntities } = await import('../templates/dashboard-vanilla/src/data/generate');
    const { customerPage, NO_FILTERS } = await import('../templates/dashboard-vanilla/src/views');
    const rows = buildEntities(40, 5150);
    const base = { ...NO_FILTERS, sortKey: null, sortDirection: null };

    const first = customerPage(rows, base);
    expect(first.rows).toHaveLength(9);
    expect(first.total).toBe(40);
    expect(first.totalPages).toBe(5);

    // Sorted across all forty, not within the nine on screen.
    const richest = customerPage(rows, { ...base, sortKey: 'amount', sortDirection: 'desc' });
    expect(richest.rows[0]!.amount).toBe(Math.max(...rows.map((row) => row.amount)));

    const pro = customerPage(rows, { ...base, plan: 'Pro', regions: ['Midlands'] });
    expect(pro.rows.length).toBeGreaterThan(0);
    expect(pro.rows.every((row) => row.plan === 'Pro' && row.region === 'Midlands')).toBe(true);

    const wanted = rows[3]!;
    const found = customerPage(rows, { ...base, query: wanted.ref.toLowerCase() });
    expect(found.rows.map((row) => row.id)).toContain(wanted.id);

    // A page past the end, once a filter shrinks the list, is the last page.
    const clamped = customerPage(rows, { ...base, page: 9, plan: 'Pro' });
    expect(clamped.page).toBe(clamped.totalPages);
    expect(clamped.rows.length).toBeGreaterThan(0);
  });

  it('filters the mail and the files, and groups the activity by day', async () => {
    const { MESSAGES, FILES, EVENTS } =
      await import('../templates/dashboard-vanilla/src/data/fixtures');
    const { visibleMail, visibleFiles, eventsByDay, unreadCount } =
      await import('../templates/dashboard-vanilla/src/views');
    expect(unreadCount(MESSAGES)).toBe(4);
    expect(visibleMail(MESSAGES, 'starred', '').every((message) => message.starred)).toBe(true);
    expect(visibleMail(MESSAGES, 'all', 'STORAGE').map((message) => message.subject)).toEqual([
      'Storage quota',
    ]);
    const archived = MESSAGES.map((message, index) =>
      index === 0 ? { ...message, folder: 'archive' as const } : message,
    );
    expect(visibleMail(archived, 'all', '')).toHaveLength(MESSAGES.length - 1);
    expect(unreadCount(archived)).toBe(3);
    expect(visibleFiles(FILES, 'starred', '').every((file) => file.starred)).toBe(true);
    expect(visibleFiles(FILES, 'all', 'zzz')).toEqual([]);
    const days = eventsByDay(EVENTS, 'access');
    expect(days.map((day) => day.day)).toEqual(['Today', 'Yesterday']);
    expect(days.flatMap((day) => day.events).every((event) => event.kind === 'access')).toBe(true);
    expect(eventsByDay(EVENTS, 'all').flatMap((day) => day.events)).toHaveLength(EVENTS.length);
  });

  it('draws the table cells the same way in every stack, with text as text', async () => {
    const { CUSTOMERS, MEMBERS } = await import('../templates/dashboard-vanilla/src/data/fixtures');
    const { customerCell, memberCell } = await import('../templates/dashboard-vanilla/src/cells');
    const customer = { ...CUSTOMERS[0]!, owner: '<img src=x onerror=alert(1)>' };
    const person = customerCell(customer, { key: 'owner' }) as HTMLElement;
    expect(person.querySelector('img')).toBeNull();
    expect(person.textContent).toContain('<img');
    const status = customerCell(customer, { key: 'status' }) as HTMLElement;
    expect(status.tagName).toBe('KT-BADGE');
    expect(status.textContent).toBe(customer.status);
    expect(customerCell(customer, { key: 'region' })).toBeUndefined();

    // The owner cannot be removed: someone has to stay.
    const removed: string[] = [];
    const cell = memberCell((member) => removed.push(member.name));
    const owner = cell(MEMBERS[0]!, { key: 'actions' }) as HTMLElement;
    expect(owner.hasAttribute('disabled')).toBe(true);
    const other = cell(MEMBERS[1]!, { key: 'actions' }) as HTMLElement;
    other.click();
    expect(removed).toEqual([MEMBERS[1]!.name]);
  });
});

describe('the editor', () => {
  const MINUTE = 60_000;

  it('keeps a version a minute, the last twenty, and restores one', async () => {
    const { createDoc, updateBody, restoreVersion, VERSION_EVERY } =
      await import('../templates/editor-vanilla/src/documents');
    expect(VERSION_EVERY).toBe(MINUTE);
    const made = createDoc([], 'Notes', 0);
    let list = made.list;
    list = updateBody(list, made.id, 'one', 1000);
    list = updateBody(list, made.id, 'two', 2000);
    const doc = () => list.find((candidate) => candidate.id === made.id)!;
    // The first save records what it replaced; another within the minute does not.
    expect(doc().versions.map((version) => version.body)).toEqual(['']);
    expect(doc().body).toBe('two');
    list = updateBody(list, made.id, 'three', 2000 + MINUTE);
    expect(doc().versions.map((version) => version.body)).toEqual(['', 'two']);

    for (let i = 0; i < 40; i += 1) list = updateBody(list, made.id, `v${i}`, (i + 3) * MINUTE * 2);
    expect(doc().versions).toHaveLength(20);

    const older = doc().versions[0]!;
    const current = doc().body;
    list = restoreVersion(list, made.id, older.at, 999 * MINUTE);
    expect(doc().body).toBe(older.body);
    // What restoring replaced is a version too: nothing is lost.
    expect(doc().versions.at(-1)!.body).toBe(current);
  });

  it('titles a document by its first heading or line, and counts its words', async () => {
    const { titleOf, wordCount } = await import('../templates/editor-vanilla/src/documents');
    expect(titleOf('# Launch plan\n\nText')).toBe('Launch plan');
    expect(titleOf('\n\nFirst line here\nSecond')).toBe('First line here');
    expect(titleOf('   ')).toBe('Untitled');
    expect(wordCount('# A title\n\nTwo words, **three**.')).toBe(5);
    expect(wordCount('')).toBe(0);
  });

  it('lists the documents as a tree: folders, then their documents', async () => {
    const { treeOf, deleteDoc } = await import('../templates/editor-vanilla/src/documents');
    const { SEED } = await import('../templates/editor-vanilla/src/content');
    const tree = treeOf(SEED);
    expect(tree.length).toBeGreaterThanOrEqual(2);
    for (const folder of tree) expect(folder.children!.length).toBeGreaterThan(0);
    const first = tree[0]!.children![0]!;
    expect(first.label).toBe(SEED.find((doc) => doc.id === first.id)!.title);
    expect(deleteDoc(SEED, first.id).some((doc) => doc.id === first.id)).toBe(false);
  });

  it('renders Markdown to nodes: blocks, inlines, and text kept as text', async () => {
    const { renderMarkdown } = await import('../templates/editor-vanilla/src/markdown');
    const box = document.createElement('div');
    box.append(
      ...renderMarkdown(
        [
          '# Title',
          '## Sub',
          'Some **bold**, *italic*, `code` and [a link](https://example.com).',
          '',
          '- one',
          '- two',
          '',
          '1. first',
          '2. second',
          '',
          '> quoted',
          '',
          '```',
          'const x = 1 < 2;',
          '```',
        ].join('\n'),
      ),
    );
    expect(box.querySelector('h1')!.textContent).toBe('Title');
    expect(box.querySelector('h2')!.textContent).toBe('Sub');
    expect(box.querySelector('p strong')!.textContent).toBe('bold');
    expect(box.querySelector('p em')!.textContent).toBe('italic');
    expect(box.querySelector('p code')!.textContent).toBe('code');
    expect(box.querySelector('a')!.getAttribute('href')).toBe('https://example.com');
    expect([...box.querySelectorAll('ul li')].map((li) => li.textContent)).toEqual(['one', 'two']);
    expect(box.querySelectorAll('ol li')).toHaveLength(2);
    expect(box.querySelector('blockquote')!.textContent).toBe('quoted');
    expect(box.querySelector('pre code')!.textContent).toBe('const x = 1 < 2;');
  });

  it('renders nothing that runs: markup stays text, unsafe links lose their href', async () => {
    const { renderMarkdown } = await import('../templates/editor-vanilla/src/markdown');
    const box = document.createElement('div');
    box.append(
      ...renderMarkdown(
        '<script>alert(1)</script> <img src=x onerror=alert(1)>\n\n[click](javascript:alert(1)) [mail](mailto:a@b.c) [here](#top)',
      ),
    );
    expect(box.querySelector('script, img')).toBeNull();
    expect(box.textContent).toContain('<script>alert(1)</script>');
    const links = [...box.querySelectorAll('a')];
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['mailto:a@b.c', '#top']);
    expect(box.textContent).toContain('click');
  });

  it('wraps the selection in Markdown, and keeps it selected', async () => {
    const { applyFormat } = await import('../templates/editor-vanilla/src/formatting');
    // "world" selected in "hello world".
    expect(applyFormat('hello world', 6, 11, 'bold')).toEqual({
      text: 'hello **world**',
      start: 8,
      end: 13,
    });
    expect(applyFormat('hello world', 6, 11, 'italic').text).toBe('hello *world*');
    expect(applyFormat('hello world', 6, 11, 'code').text).toBe('hello `world`');
    expect(applyFormat('hello world', 6, 11, 'link')).toEqual({
      text: 'hello [world](https://)',
      start: 14,
      end: 22,
    });
    // Line formats apply to the lines the selection touches.
    expect(applyFormat('one\ntwo', 0, 5, 'list').text).toBe('- one\n- two');
    expect(applyFormat('one\ntwo', 5, 5, 'heading').text).toBe('one\n## two');
    expect(applyFormat('one', 0, 0, 'quote').text).toBe('> one');
    // Nothing selected: a placeholder, selected, to type over.
    const empty = applyFormat('ab', 1, 1, 'bold');
    expect(empty.text).toBe('a**bold text**b');
    expect(empty.text.slice(empty.start, empty.end)).toBe('bold text');
  });

  it('seeds the documents, and keeps working when storage refuses', async () => {
    const { loadDocs, saveDocs } = await import('../templates/editor-vanilla/src/store');
    const { SEED } = await import('../templates/editor-vanilla/src/content');
    localStorage.clear();
    expect(loadDocs()).toEqual(SEED);
    const changed = SEED.map((doc, index) => (index === 0 ? { ...doc, body: 'changed' } : doc));
    saveDocs(changed);
    expect(loadDocs()[0]!.body).toBe('changed');
    localStorage.setItem('kanto-editor', '{not json');
    expect(loadDocs()).toEqual(SEED);
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadDocs()).toEqual(SEED);
    spy.mockRestore();
    localStorage.clear();
  });
});
