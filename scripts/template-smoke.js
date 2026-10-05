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
  },
};
