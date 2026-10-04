import { describe, expect, it, vi } from 'vitest';
import { fixture } from '#test/fixture';
import './kt-newsletter.js';
import type { KtNewsletter } from 'kanto-ds';

const root = (el: KtNewsletter) => el.shadowRoot!;
const field = (el: KtNewsletter) =>
  root(el).querySelector('kt-input') as HTMLElement & {
    value: string;
    error: string;
    label: string;
  };

async function letter(markup = '<kt-newsletter heading="Notes, monthly"></kt-newsletter>') {
  return fixture<KtNewsletter>(markup);
}

describe('kt-newsletter', () => {
  it('is a section named by its heading, with an email field that says what it wants', async () => {
    const el = await letter();
    const section = root(el).querySelector('section')!;
    const label = root(el).getElementById(section.getAttribute('aria-labelledby')!)!;
    expect(label.textContent!.trim()).toBe('Notes, monthly');
    expect(field(el).getAttribute('type')).toBe('email');
    expect(field(el).getAttribute('autocomplete')).toBe('email');
    expect(field(el).label).toBe('Email address');
  });

  it('says what is wrong with an address that is not one, and sends nothing', async () => {
    const el = await letter();
    const sent = vi.fn();
    el.addEventListener('kt-subscribe', sent);
    field(el).value = 'ada@';
    el.subscribe();
    await el.updateComplete;
    expect(field(el).error).toBe('Enter an email address, like name@example.com.');
    expect(sent).not.toHaveBeenCalled();
  });

  it('sends the address, and thanks once the sending is done', async () => {
    const el = await letter();
    let finish!: () => void;
    el.addEventListener('kt-subscribe', (event) => {
      const { email, wait } = (event as CustomEvent).detail;
      expect(email).toBe('ada@northwind.com');
      wait(new Promise<void>((resolve) => (finish = resolve)));
    });
    field(el).value = ' ada@northwind.com ';
    el.subscribe();
    expect(el.subscribed).toBe(false);
    finish();
    await vi.waitFor(() => expect(el.subscribed).toBe(true));
    await el.updateComplete;
    expect(el.hasAttribute('subscribed')).toBe(true);
    const done = root(el).querySelector('[role="status"]')!;
    expect(done.textContent).toContain('Check your inbox');
  });

  it('thanks at once when nothing is waited for', async () => {
    const el = await letter();
    field(el).value = 'ada@northwind.com';
    el.subscribe();
    await vi.waitFor(() => expect(el.subscribed).toBe(true));
  });

  it('says so on the field when the sending fails', async () => {
    const el = await letter();
    el.addEventListener('kt-subscribe', (event) =>
      (event as CustomEvent).detail.wait(Promise.reject(new Error('Already subscribed.'))),
    );
    field(el).value = 'ada@northwind.com';
    el.subscribe();
    await vi.waitFor(() => expect(field(el).error).toBe('Already subscribed.'));
    expect(el.subscribed).toBe(false);
  });

  it('sits on a panel by default, stacked; reflects both', async () => {
    const el = await letter();
    expect(el.getAttribute('variant')).toBe('panel');
    expect(el.getAttribute('layout')).toBe('stacked');
  });

  it('takes its words in texts', async () => {
    const el = await letter();
    el.texts = { email: 'Adresse e-mail', subscribe: "S'abonner" };
    await el.updateComplete;
    expect(field(el).label).toBe('Adresse e-mail');
    expect(root(el).querySelector('kt-button')!.textContent!.trim()).toBe("S'abonner");
  });
});
