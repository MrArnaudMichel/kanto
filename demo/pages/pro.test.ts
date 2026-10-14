import { existsSync, readFileSync } from 'node:fs';
import { render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { KT_DEFAULT_APPEARANCE } from 'kanto-ds';
import {
  PRO,
  PRO_DONE,
  PRO_PHONES,
  PRO_QUESTIONS,
  PRO_SCREENS,
  type ProOffer,
} from '../lib/pro.js';
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
      'pro-parts',
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
    expect(
      [...page.querySelectorAll('.pro-parts h3')].map((each) => each.textContent!.trim()),
    ).toEqual(['Your product', 'Account', 'Admin']);
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

  it('offers the live demo as a button beside the one that buys', () => {
    const page = mount({ ...PRO, demo: 'https://demo.example' });
    const demo = page.querySelector<HTMLAnchorElement>('.pro-hero .home-actions a.pro-demo')!;
    expect(demo.classList.contains('pro-button-secondary')).toBe(true);
    expect(demo.target).toBe('_blank');
  });

  it('opens each part in the demo, straight in, as the one who uses it', () => {
    const page = mount({ ...PRO, demo: 'https://demo.example' });
    expect(
      [...page.querySelectorAll<HTMLAnchorElement>('.pro-parts a.pro-try')].map((link) => [
        link.textContent!.trim(),
        link.href,
      ]),
    ).toEqual([
      ['Try it as a customer', 'https://demo.example/?as=customer'],
      ['Try it as a customer', 'https://demo.example/?as=customer'],
      ['Try it as the creator', 'https://demo.example/?as=creator'],
    ]);
    document.body.replaceChildren();
    expect(mount({ ...PRO, demo: '' }).querySelector('a.pro-try')).toBeNull();
  });

  it('shows the same app on a phone, at a phone’s size', () => {
    const phones = [
      ...mount().querySelectorAll<HTMLImageElement>('.pro-phones img.pro-shot-light'),
    ];
    expect(phones).toHaveLength(PRO_PHONES.length);
    for (const phone of phones) expect([phone.width, phone.height]).toEqual([390, 844]);
    for (const shot of PRO_PHONES)
      for (const theme of ['light', 'dark'])
        expect(existsSync(`demo/public/pro/${shot.file}-${theme}.webp`), shot.file).toBe(true);
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

describe('what the page promises, as the product holds it', () => {
  it('sells no database a buyer cannot deploy yet, and says where uploads need a server', () => {
    expect(PRO_DONE.map((item) => item.body).join(' ')).not.toMatch(/\bD1\b/);
    const hosts = PRO_QUESTIONS.find((question) => /where does it run/i.test(question.heading))!;
    expect(hosts.answer).toMatch(/server/i);
    expect(hosts.answer).toMatch(/upload|files/i);
  });

  it('answers refunds, before anyone has to ask', () => {
    expect(PRO_QUESTIONS.some((question) => /refund/i.test(question.heading))).toBe(true);
  });

  it('names the hero screen in either theme', () => {
    const shots = [...mount().querySelectorAll<HTMLImageElement>('.pro-hero-shot img')];
    expect(shots).toHaveLength(2);
    for (const shot of shots) {
      expect(shot.alt).toMatch(/\S/);
      expect(shot.hasAttribute('aria-hidden')).toBe(false);
    }
  });

  it("draws Buy with the button's own tokens, not look-alike ones", () => {
    const css = readFileSync('demo/pro.css', 'utf8');
    expect(css).not.toMatch(/--color-primary-on|--radius-button/);
    expect(css).toMatch(/var\(--border-radius\)/);
  });

  it('follows the Auto theme in a light system, not only the Light one', () => {
    expect(readFileSync('demo/home.css', 'utf8')).toMatch(
      /prefers-color-scheme: light\)[\s\S]*data-theme='auto'[\s\S]*\.pro-shot-light/,
    );
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
    expect(readFileSync('demo/pages/templates.ts', 'utf8')).toMatch(
      /entry\.id === 'saas'[\s\S]*#\/pro/,
    );
  });
});
