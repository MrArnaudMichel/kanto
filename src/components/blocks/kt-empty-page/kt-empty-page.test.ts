import { describe, expect, it, vi } from 'vitest';
import { fixture } from '#test/fixture';
import './kt-empty-page.js';
import type { KtEmptyPage, KtFirstStep } from 'kanto-ds';

const root = (el: KtEmptyPage) => el.shadowRoot!;

const STEPS: KtFirstStep[] = [
  { id: 'company', title: 'Add your company', description: 'Name, address, logo.', done: true },
  { id: 'customer', title: 'Add a customer', action: 'Add customer' },
  { id: 'invoice', title: 'Send your first invoice', href: '/invoices/new', action: 'New invoice' },
];

async function page(
  markup = '<kt-empty-page heading="Welcome, Ada" lead="Three steps and you are sending."></kt-empty-page>',
) {
  const el = await fixture<KtEmptyPage>(markup);
  el.steps = STEPS;
  await el.updateComplete;
  return el;
}

const items = (el: KtEmptyPage) => [...root(el).querySelectorAll<HTMLElement>('.steps > li')];

describe('kt-empty-page', () => {
  it('is a section named by its heading, an h1, with its lead', async () => {
    const el = await page();
    const section = root(el).querySelector('section')!;
    const label = root(el).getElementById(section.getAttribute('aria-labelledby')!)!;
    expect(label.textContent!.trim()).toBe('Welcome, Ada');
    expect(root(el).querySelector('h1')).not.toBeNull();
    expect(root(el).querySelector('.block-lead')!.textContent).toBe(
      'Three steps and you are sending.',
    );
  });

  it('lists the first steps in order, each title a level under', async () => {
    const el = await page();
    expect(root(el).querySelector('ol.steps')).not.toBeNull();
    expect(items(el)).toHaveLength(3);
    expect(items(el)[1]!.querySelector('h2')!.textContent!.trim()).toBe('Add a customer');
    expect(items(el)[0]!.querySelector('.step-description')!.textContent).toBe(
      'Name, address, logo.',
    );
  });

  it('says how far along it is', async () => {
    const el = await page();
    const bar = root(el).querySelector('kt-progress-bar')!;
    expect(bar.getAttribute('value')).toBe('1');
    expect(bar.getAttribute('max')).toBe('3');
    expect(root(el).querySelector('.progress-label')!.textContent!.trim()).toBe('1 of 3 done');
  });

  it('marks a done step, for the eye and for assistive tech', async () => {
    const el = await page();
    const [done, todo] = items(el);
    expect(done!.classList.contains('done')).toBe(true);
    expect(done!.querySelector('.visually-hidden')!.textContent!.trim()).toBe('Done:');
    expect(done!.querySelector('kt-button, a.action')).toBeNull();
    expect(todo!.classList.contains('done')).toBe(false);
  });

  it('fires kt-step from a step without an href, and links one with', async () => {
    const el = await page();
    const chosen = vi.fn();
    el.addEventListener('kt-step', (event) => chosen((event as CustomEvent).detail));
    const button = items(el)[1]!.querySelector('kt-button')!;
    expect(button.textContent!.trim()).toBe('Add customer');
    button.click();
    expect(chosen).toHaveBeenCalledWith({ id: 'customer' });
    const link = items(el)[2]!.querySelector('a.action')!;
    expect(link.getAttribute('href')).toBe('/invoices/new');
    expect(link.textContent!.trim()).toBe('New invoice');
  });

  it('takes its words in texts', async () => {
    const el = await page();
    el.texts = { progress: (done, total) => `${done} sur ${total}`, done: 'Fait :' };
    await el.updateComplete;
    expect(root(el).querySelector('.progress-label')!.textContent!.trim()).toBe('1 sur 3');
    expect(items(el)[0]!.querySelector('.visually-hidden')!.textContent!.trim()).toBe('Fait :');
  });
});
