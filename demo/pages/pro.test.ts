import { existsSync, readFileSync } from 'node:fs';
import { render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { KT_DEFAULT_APPEARANCE } from 'kanto-ds';
import { PRO, PRO_DONE, PRO_QUESTIONS, PRO_SCREENS, type ProOffer } from '../lib/pro.js';
import { homePage } from './home.js';
import { proPage } from './pro.js';
import { templatesPage } from './templates.js';

function mount(pro: ProOffer = PRO) {
  const host = document.body.appendChild(document.createElement('main'));
  render(proPage(pro), host);
  return host;
}

afterEach(() => document.body.replaceChildren());

describe('the Kanto SaaS Pro page', () => {
  it('says what it is, then shows it: what is done, the setup, your product, the screens, free or Pro, the price, questions', () => {
    const page = mount();
    expect(page.querySelector('h1')!.textContent).toMatch(/\S/);
    for (const id of [
      'pro-done',
      'pro-setup',
      'pro-product',
      'pro-screens',
      'pro-compare',
      'pro-pricing',
      'pro-questions',
    ]) {
      expect(page.querySelector(`section[aria-labelledby="${id}"] #${id}`), id).not.toBeNull();
    }
    expect(page.querySelectorAll('.pro-done li')).toHaveLength(PRO_DONE.length);
    expect(page.querySelectorAll('kt-collapsible')).toHaveLength(PRO_QUESTIONS.length);
  });

  it('waits to sell until the shop is open, and sells through it once it is', () => {
    const closed = mount({ ...PRO, checkout: '' });
    for (const buy of closed.querySelectorAll<HTMLElement & { disabled: boolean }>(
      'kt-button.pro-buy',
    ))
      expect(buy.disabled).toBe(true);
    expect(closed.textContent).toContain('Opening soon');
    document.body.replaceChildren();
    const open = mount({ ...PRO, checkout: 'https://buy.polar.sh/polar_cl_x' });
    const links = [...open.querySelectorAll<HTMLAnchorElement>('a.pro-buy')];
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) expect(link.href).toBe('https://buy.polar.sh/polar_cl_x');
    expect(open.textContent).toContain(`€${PRO.price}`);
  });

  it('links the live demo only once there is one', () => {
    expect(mount({ ...PRO, demo: '' }).querySelector('a.pro-demo')).toBeNull();
    document.body.replaceChildren();
    expect(
      mount({ ...PRO, demo: 'https://demo.example' }).querySelector<HTMLAnchorElement>(
        'a.pro-demo',
      )!.href,
    ).toBe('https://demo.example/');
  });

  it('shows screens that exist, in both themes', () => {
    for (const screen of PRO_SCREENS) {
      for (const theme of ['light', 'dark'])
        expect(
          existsSync(`demo/public/pro/${screen.file}-${theme}.webp`),
          `${screen.file}-${theme}`,
        ).toBe(true);
    }
  });
});

describe('the way to it', () => {
  it('is on the home page, the templates gallery and the README', () => {
    const home = document.body.appendChild(document.createElement('main'));
    render(
      homePage({ appearance: KT_DEFAULT_APPEARANCE, onUse: () => {}, rerender: () => {} }),
      home,
    );
    expect(home.querySelector('a[href="#/pro"]')).not.toBeNull();
    const gallery = document.body.appendChild(document.createElement('main'));
    render(templatesPage().body, gallery);
    expect(gallery.querySelector('a[href="#/pro"]')).not.toBeNull();
    expect(readFileSync('README.md', 'utf8')).toContain('#/pro');
  });
});
