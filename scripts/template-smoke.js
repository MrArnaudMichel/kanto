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
      .locator('kt-toggle-button-group.work-filter kt-toggle-button[value="Open source"]')
      .click();
    await until(() => document.querySelectorAll('kt-card.work-card').length === 1);
    await page.locator('kt-toggle-button-group.work-filter kt-toggle-button[value="All"]').click();
    await until(() => document.querySelectorAll('kt-card.work-card').length === 4);

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
    await page.locator('form.contact kt-button[type="submit"]').click();
    await until(() => (document.querySelector('kt-input[name="name"]')?.error ?? '') !== '');
    await page.locator('kt-input[name="name"] input').fill('Ada Park');
    await page.locator('kt-input[name="email"] input').fill('ada@northwind.com');
    await page.locator('kt-textarea[name="message"] textarea').fill('A dashboard for a fleet.');
    await page.locator('form.contact kt-button[type="submit"]').click();
    await until(() => document.querySelector('kt-alert.contact-sent') !== null);

    // On a phone the header's links are in its menu.
    await page.setViewportSize({ width: 390, height: 800 });
    // Nothing wider than the phone: no sideways scroll.
    await until(() => document.documentElement.scrollWidth <= window.innerWidth);
    await page.locator('kt-header .menu-button').click();
    await page.locator('kt-header [slot="menu"] a', { hasText: 'Contact' }).click();
    await until(() => location.hash === '#contact');
  },
};
