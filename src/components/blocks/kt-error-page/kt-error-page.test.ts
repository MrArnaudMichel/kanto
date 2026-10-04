import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-error-page.js';
import type { KtErrorPage } from 'kanto-ds';

const root = (el: KtErrorPage) => el.shadowRoot!;
const heading = (el: KtErrorPage) => root(el).querySelector('h1, h2, h3')!.textContent!.trim();
const buttons = (el: KtErrorPage) =>
  [...root(el).querySelectorAll('kt-button')].map((button) => button.textContent!.trim());

describe('kt-error-page', () => {
  it('says a page was not found, with its code, and leads home', async () => {
    const el = await fixture<KtErrorPage>('<kt-error-page home-href="/app"></kt-error-page>');
    expect(el.getAttribute('kind')).toBe('not-found');
    expect(heading(el)).toBe('Page not found');
    expect(root(el).querySelector('.code')!.textContent!.trim()).toBe('404');
    const home = root(el).querySelector('a.home')!;
    expect(home.getAttribute('href')).toBe('/app');
  });

  it('says something went wrong, and offers to try again', async () => {
    const el = await fixture<KtErrorPage>('<kt-error-page kind="error"></kt-error-page>');
    expect(heading(el)).toBe('Something went wrong');
    expect(root(el).querySelector('.code')!.textContent!.trim()).toBe('500');
    expect(buttons(el)).toContain('Try again');
  });

  it('fires kt-retry on Try again, which the page can take over', async () => {
    const el = await fixture<KtErrorPage>('<kt-error-page kind="error"></kt-error-page>');
    const retried = vi.fn((event: Event) => event.preventDefault());
    el.addEventListener('kt-retry', retried);
    [...root(el).querySelectorAll<HTMLElement>('kt-button')]
      .find((button) => button.textContent!.trim() === 'Try again')!
      .click();
    expect(retried).toHaveBeenCalledOnce();
  });

  it('says it is down for maintenance, without a way out it does not have', async () => {
    const el = await fixture<KtErrorPage>('<kt-error-page kind="maintenance"></kt-error-page>');
    expect(heading(el)).toBe('Back in a moment');
    expect(root(el).querySelector('.code')!.textContent!.trim()).toBe('503');
    expect(buttons(el)).toEqual([]);
  });

  it('takes its own code, words and heading level', async () => {
    const el = await fixture<KtErrorPage>(
      '<kt-error-page code="410" heading-level="2"></kt-error-page>',
    );
    el.texts = { notFoundHeading: 'Page introuvable' };
    await settle(el);
    expect(root(el).querySelector('.code')!.textContent!.trim()).toBe('410');
    expect(root(el).querySelector('h2')!.textContent!.trim()).toBe('Page introuvable');
  });

  it('gives its place to slotted actions', async () => {
    const el = await fixture<KtErrorPage>(
      '<kt-error-page><a slot="actions" href="/help">Visit the help centre</a></kt-error-page>',
    );
    await settle(el);
    expect(root(el).querySelector('a.home')).toBeNull();
  });
});
