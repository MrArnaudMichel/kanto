/**
 * What each kind of template must do once built — the same walk for every
 * stack, so React, Vue and plain TypeScript are held to one behaviour. Each
 * takes a Playwright page and the served build's address.
 *
 * Selectors go through shadow roots (Playwright's CSS does), and reach the
 * elements by what every stack renders the same way: tags, `name`s, classes.
 */
const TIMEOUT = 10_000;

/** @type {Record<string, (page: import('playwright').Page, base: string) => Promise<void>>} */
export const SMOKES = {
  async saas(page, base) {
    const at = (hash) => page.goto(`${base}#${hash}`);
    // waitForFunction sends the function to the page as text: it reads only its argument.
    const until = (check, arg) => page.waitForFunction(check, arg, { timeout: TIMEOUT });

    // Signed out, the app opens on sign-in.
    await at('/');
    await until(() => location.hash === '#/sign-in');

    // Any email and password get in, onto the dashboard.
    await page.locator('kt-auth-form kt-input[name="email"] input').fill('ada@northwind.com');
    await page.locator('kt-auth-form kt-input[name="password"] input').fill('correct-horse');
    await page.locator('kt-auth-form kt-button.submit').click();
    await until(() => location.hash === '#/');
    await until(() => document.querySelectorAll('kt-stat').length === 4);
    // The sidebar owns its background: the navigation is flush, not a card in it.
    await until(
      () => document.querySelector('kt-sub-menu-navigation')?.hasAttribute('flush') === true,
    );
    await until(() => (document.querySelector('kt-table')?.data ?? []).length > 0);

    // Customers: all of them, then only the ones a search finds, then one opened.
    await at('/customers');
    await until(() => (document.querySelector('kt-table')?.data ?? []).length === 24);
    await page.locator('kt-input.search input').fill('kiln');
    await until(() => {
      const data = document.querySelector('kt-table')?.data ?? [];
      return data.length > 0 && data.every((row) => row.company === 'Kiln');
    });
    await page.locator('kt-table tbody tr').first().click();
    await until(() => document.querySelector('kt-side-panel')?.open === true);

    // Settings, first steps, and a page that is not there.
    await at('/settings');
    await until(() => document.querySelectorAll('kt-settings-section').length === 3);
    await at('/welcome');
    await until(() => document.querySelector('kt-empty-page')?.steps?.length === 4);
    await at('/no-such-page');
    await until(() => document.querySelector('kt-error-page') !== null);
  },

  async landing(page, base) {
    const until = (check) => page.waitForFunction(check, undefined, { timeout: TIMEOUT });
    await page.goto(base);
    await until(() => (document.querySelector('kt-hero')?.heading ?? '').length > 0);
    await until(() => document.querySelectorAll('kt-logo-cloud img').length >= 5);
    await until(() => (document.querySelector('kt-feature-grid')?.features ?? []).length === 6);
    await until(() => (document.querySelector('kt-pricing-table')?.plans ?? []).length === 3);
    await until(() => (document.querySelector('kt-faq')?.items ?? []).length >= 4);
    await until(() => (document.querySelector('kt-footer')?.columns ?? []).length >= 2);

    // The billing switch swaps the prices.
    await page.locator('kt-pricing-table kt-segmented-control [role="radio"]').nth(1).click();
    await until(() => document.querySelector('kt-pricing-table')?.billing === 'yearly');

    // The newsletter takes an address and thanks the reader.
    await page.locator('kt-newsletter kt-input input').fill('ada@northwind.com');
    await page.locator('kt-newsletter kt-button').click();
    await until(() => document.querySelector('kt-newsletter')?.subscribed === true);

    // The closing call to action does something: here, it says where sign-up goes.
    await page.locator('kt-cta kt-button').first().click();
    await until(() => document.querySelectorAll('kt-toast').length > 0);

    // On a phone the header's links are in its menu, and a link closes it.
    await page.setViewportSize({ width: 390, height: 800 });
    await page.locator('kt-header .menu-button').click();
    await page.locator('kt-header [slot="menu"] a', { hasText: 'Pricing' }).click();
    await until(() => location.hash === '#pricing');
  },

  async portfolio(page, base) {
    const until = (check) => page.waitForFunction(check, undefined, { timeout: TIMEOUT });
    await page.goto(base);
    await until(() => document.querySelector('.intro h1') !== null);
    await until(() => document.querySelectorAll('kt-stat').length === 4);
    await until(() => document.querySelectorAll('kt-card.work-card').length === 4);
    await until(() => document.querySelectorAll('kt-timeline-item').length >= 4);
    await until(() => (document.querySelector('kt-post-grid')?.posts ?? []).length === 3);

    // Filtering: one tag, then back to everything.
    await page
      .locator('kt-toggle-button-group.work-filter')
      .getByRole('button', { name: 'Open source', exact: true })
      .click();
    await until(() => document.querySelectorAll('kt-card.work-card').length === 1);
    await page
      .locator('kt-toggle-button-group.work-filter')
      .getByRole('button', { name: 'All', exact: true })
      .click();
    await until(() => document.querySelectorAll('kt-card.work-card').length === 4);

    // The filter cannot be emptied: the chosen tag clicked again keeps a tag chosen.
    const tagButton = (name) =>
      page.locator('kt-toggle-button-group.work-filter').getByRole('button', { name, exact: true });
    await tagButton('All').click();
    await until(
      () => document.querySelector('kt-toggle-button-group.work-filter')?.value === 'All',
    );
    await tagButton('Product').click();
    await tagButton('Product').click();
    await until(
      () =>
        document.querySelector('kt-toggle-button-group.work-filter')?.value === 'All' &&
        document.querySelectorAll('kt-card.work-card').length === 4,
    );

    // A case study, then another: the panel follows.
    await page.locator('kt-card.work-card').nth(0).click();
    await until(() => document.querySelector('kt-side-panel')?.open === true);
    const first = await page.evaluate(() => document.querySelector('kt-side-panel')?.heading);
    await page.keyboard.press('Escape');
    await until(() => document.querySelector('kt-side-panel')?.open === false);
    await page.locator('kt-card.work-card').nth(1).click();
    await page.waitForFunction(
      (previous) =>
        document.querySelector('kt-side-panel')?.open === true &&
        document.querySelector('kt-side-panel')?.heading !== previous,
      first,
      { timeout: TIMEOUT },
    );
    await page.keyboard.press('Escape');

    // The form says what is missing, then sends.
    await page.locator('form.contact').getByRole('button', { name: 'Send' }).click();
    await until(() => (document.querySelector('form.contact kt-input')?.error ?? '') !== '');
    await page.locator('form.contact kt-input').nth(0).locator('input').fill('Ada Park');
    await page.locator('form.contact kt-input').nth(1).locator('input').fill('ada@northwind.com');
    await page.locator('form.contact kt-textarea textarea').fill('A dashboard for a fleet.');
    await page.locator('form.contact').getByRole('button', { name: 'Send' }).click();
    await until(() => document.querySelector('kt-alert.contact-sent') !== null);

    // On a phone the header's links are in its menu.
    await page.setViewportSize({ width: 390, height: 800 });
    // Nothing wider than the phone: no sideways scroll.
    await until(() => document.documentElement.scrollWidth <= window.innerWidth);
    await page.locator('kt-header .menu-button').click();
    await page.locator('kt-header [slot="menu"] a', { hasText: 'Contact' }).click();
    await until(() => location.hash === '#contact');
  },

  async dashboard(page, base) {
    const until = (check, arg) => page.waitForFunction(check, arg, { timeout: TIMEOUT });

    // Every screen, each by its marker.
    const screens = [
      ['/', 'home'],
      ['/inbox', 'inbox'],
      ['/customers', 'customers'],
      ['/files', 'files'],
      ['/activity', 'activity'],
      ['/integrations', 'integrations'],
      ['/settings/general', 'general'],
      ['/settings/members/people', 'people'],
      ['/settings/members/roles', 'roles'],
      ['/settings/notifications', 'notifications'],
      ['/settings/security', 'security'],
    ];
    for (const [path, name] of screens) {
      await page.goto(`${base}#${path}`);
      await until((marker) => document.querySelector(`.screen-${marker}`) !== null, name);
    }

    // The overview: four figures, the latest orders.
    await page.goto(`${base}#/`);
    await until(() => document.querySelectorAll('.screen-home kt-stat').length === 4);
    await until(() => (document.querySelector('.screen-home kt-table')?.data ?? []).length === 5);

    // A deep route opens its branch, and marks its own link.
    await page.goto(`${base}#/settings/members/roles`);
    await until(() => {
      const nav = document.querySelector('kt-sub-menu-navigation');
      const current = nav?.shadowRoot?.querySelector('[aria-current="page"]');
      return current?.textContent?.trim() === 'Roles';
    });

    // Cmd+K from anywhere, a command, and the palette closes on the screen it chose.
    await page.keyboard.press('Control+k');
    await until(() => document.querySelector('kt-command-palette')?.open === true);
    await page.keyboard.type('Customers');
    await page.keyboard.press('Enter');
    await until(
      () => location.hash === '#/customers' && document.querySelector('.screen-customers') !== null,
    );
    await until(() => document.querySelector('kt-command-palette')?.open === false);

    // Deleting in bulk asks first; cancelling keeps every row.
    await until(
      () => (document.querySelector('.screen-customers kt-table')?.data ?? []).length === 9,
    );
    const total = () => document.querySelector('.screen-customers .customer-count')?.textContent;
    const before = await page.evaluate(total);
    await page.locator('.screen-customers kt-table tbody tr').first().locator('input').check();
    await page.locator('.bulk-bar').getByRole('button', { name: 'Delete' }).click();
    await until(() => document.querySelector('kt-confirm-dialog')?.open === true);
    await page.keyboard.press('Escape');
    await until(
      (count) =>
        document.querySelector('kt-confirm-dialog')?.open === false &&
        document.querySelector('.screen-customers .customer-count')?.textContent === count,
      before,
    );

    // A page that is not there.
    await page.goto(`${base}#/no-such-screen`);
    await until(() => document.querySelector('kt-error-page') !== null);

    // A phone: no sideways scroll, and the sidebar is a drawer a link closes.
    await page.setViewportSize({ width: 390, height: 800 });
    for (const path of ['/', '/customers', '/inbox', '/settings/general']) {
      await page.goto(`${base}#${path}`);
      await until(() => document.querySelector('.screen') !== null);
      await until(() => document.documentElement.scrollWidth <= window.innerWidth);
    }
    await page.locator('.menu-button').click();
    await until(() => document.querySelector('.app')?.classList.contains('nav-open') === true);
    await page.locator('kt-sub-menu-navigation a', { hasText: 'Files' }).click();
    await until(
      () =>
        location.hash === '#/files' &&
        document.querySelector('.app')?.classList.contains('nav-open') === false,
    );
  },

  async chat(page, base) {
    const until = (check, arg) => page.waitForFunction(check, arg, { timeout: TIMEOUT });
    const ask = async (question) => {
      await page.locator('kt-prompt-input textarea').fill(question);
      await page.locator('kt-prompt-input textarea').press('Enter');
    };
    await page.goto(base);

    // The seeded conversations, the first one open.
    await until(() => document.querySelectorAll('.conversations .conversation').length >= 2);
    await until(() => document.querySelectorAll('.transcript kt-chat-message').length >= 2);

    // A new conversation: suggestions, then a question streamed into an answer.
    await page.getByRole('button', { name: 'New chat', exact: true }).click();
    await until(() => document.querySelector('.transcript kt-empty-state') !== null);
    await until(() => document.querySelectorAll('.conversations .conversation').length >= 3);
    await ask('Which regions are growing?');
    await until(() => {
      const messages = [...document.querySelectorAll('.transcript kt-chat-message')];
      const last = messages.at(-1);
      return (
        messages.length === 2 &&
        last?.from === 'assistant' &&
        last.streaming === false &&
        last.textContent.trim().length > 40
      );
    });
    // The conversation took its title from the question.
    await until(() =>
      document
        .querySelector('.conversation[aria-current="true"]')
        ?.textContent.includes('Which regions'),
    );

    // Back to the first conversation: its own messages.
    await page.locator('.conversations .conversation').nth(1).click();
    await until(() =>
      document.querySelector('.transcript kt-chat-message')?.textContent.includes('Why is revenue'),
    );

    // A finished answer is announced once, not the whole transcript on every word.
    await until(() => !document.querySelector('.transcript')?.hasAttribute('aria-live'));
    await until(() =>
      (document.querySelector('.announcer')?.textContent ?? '').includes('North East'),
    );

    // One reply at a time: a suggestion makes the prompt wait like a question does.
    await page.getByRole('button', { name: 'New chat', exact: true }).click();
    await page.getByRole('button', { name: 'What happened to churn?', exact: true }).click();
    await until(() => document.querySelector('kt-prompt-input')?.disabled === true);
    await until(() => document.querySelector('kt-prompt-input')?.disabled === false);
    await until(() => document.querySelectorAll('.transcript kt-chat-message').length === 2);

    // The transcript follows the answer as it streams, on a short screen.
    await page.setViewportSize({ width: 1280, height: 420 });
    await ask('Why is revenue down 3% this month?');
    await until(() => document.querySelector('kt-prompt-input')?.disabled === false);
    await until(() => {
      const box = document.querySelector('.transcript');
      return box !== null && box.scrollHeight - box.scrollTop - box.clientHeight < 40;
    });

    // A conversation chosen while an answer streams opens at once.
    await ask('Which regions are growing?');
    await page.locator('.conversations .conversation').nth(2).click();
    await until(
      () =>
        document
          .querySelector('.conversations li:nth-child(3) .conversation')
          ?.getAttribute('aria-current') === 'true',
    );
    await until(() => document.querySelector('kt-prompt-input')?.disabled === false);

    // A phone: no sideways scroll, and the list is in the shell's drawer.
    await page.setViewportSize({ width: 390, height: 800 });
    await until(() => document.documentElement.scrollWidth <= window.innerWidth);
    await until(() => document.querySelector('kt-app-shell')?.hasAttribute('narrow') === true);
  },
};
