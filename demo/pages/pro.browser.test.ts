/**
 * The Kanto SaaS Pro page, audited by axe in both themes, shop closed and
 * open: it sells, so it reads as well as the pages it sells.
 */
import axe from 'axe-core';
import { render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { settle } from '#test/fixture';
import 'kanto-ds/styles.css';
import '../shell.css';
import '../home.css';
import '../pro.css';
import { PRO } from '../lib/pro.js';
import { proPage, proThanksPage } from './pro.js';

afterEach(() => {
  document.body.replaceChildren();
  delete document.documentElement.dataset['theme'];
});

describe.each(['dark', 'light'])('the Pro page, %s theme', (theme) => {
  it.each([
    ['closed', ''],
    ['open', 'https://buy.polar.sh/polar_cl_x'],
  ])('has no axe violations, the shop %s', async (_, checkout) => {
    if (theme === 'light') document.documentElement.dataset['theme'] = 'light';
    const host = document.body.appendChild(document.createElement('main'));
    host.style.background = 'var(--surface-page)';
    render(proPage({ ...PRO, checkout, demo: 'https://demo.example' }), host);
    await Promise.all(
      [...document.body.querySelectorAll('*')]
        .filter((el) => el.localName.startsWith('kt-'))
        .map((el) => settle(el)),
    );
    const results = await axe.run(document.body, {
      resultTypes: ['violations'],
      rules: { region: { enabled: false } },
    });
    expect(
      results.violations.flatMap((v) =>
        v.nodes.map((n) => `${v.id}: ${n.target} ${n.any[0]?.message ?? ''}`),
      ),
    ).toEqual([]);
  });
});

describe.each(['dark', 'light'])('the thank-you page, %s theme', (theme) => {
  it('has no axe violations', async () => {
    if (theme === 'light') document.documentElement.dataset['theme'] = 'light';
    const host = document.body.appendChild(document.createElement('main'));
    host.style.background = 'var(--surface-page)';
    render(proThanksPage(), host);
    await Promise.all(
      [...document.body.querySelectorAll('*')]
        .filter((el) => el.localName.startsWith('kt-'))
        .map((el) => settle(el)),
    );
    const results = await axe.run(document.body, {
      resultTypes: ['violations'],
      rules: { region: { enabled: false } },
    });
    expect(results.violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target}`))).toEqual(
      [],
    );
  });
});
