/**
 * The home page, audited by axe in both themes: it is the first page a
 * visitor sees, and it is built from the components it advertises.
 */
import axe from 'axe-core';
import { render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { settle } from '#test/fixture';
import 'kanto-ds/styles.css';
import '../shell.css';
import '../home.css';
import { KT_DEFAULT_APPEARANCE } from 'kanto-ds';
import { homePage } from './home.js';

afterEach(() => {
  delete document.documentElement.dataset['theme'];
  document.body.replaceChildren();
});

describe.each(['dark', 'light'])('the home page, %s theme', (theme) => {
  it('has no axe violations', async () => {
    if (theme === 'light') document.documentElement.dataset['theme'] = 'light';
    const host = document.body.appendChild(document.createElement('main'));
    // On the site the page surface is behind it; the test runner's is not.
    host.style.background = 'var(--surface-page)';
    const draw = () =>
      render(
        homePage({ appearance: KT_DEFAULT_APPEARANCE, onUse: () => {}, rerender: draw }),
        host,
      );
    draw();
    await Promise.all(
      [...host.querySelectorAll('*')]
        .filter((el) => el.localName.startsWith('kt-'))
        .map((el) => settle(el)),
    );
    const results = await axe.run(host, {
      resultTypes: ['violations'],
      rules: { region: { enabled: false } },
    });
    expect(
      results.violations.flatMap((v) =>
        v.nodes.map((n) => `${v.id}: ${n.target} ${n.any[0]?.message ?? ''}`),
      ),
    ).toEqual([]);
  });

  it('lazy-loads its app miniatures and keeps them out of the tab order', async () => {
    const host = document.body.appendChild(document.createElement('main'));
    render(
      homePage({ appearance: KT_DEFAULT_APPEARANCE, onUse: () => {}, rerender: () => {} }),
      host,
    );
    const frames = [...host.querySelectorAll('iframe')];
    expect(frames.length).toBe(4);
    for (const frame of frames) {
      expect(frame.getAttribute('loading')).toBe('lazy');
      expect(frame.hasAttribute('inert')).toBe(true);
      expect(frame.getAttribute('tabindex')).toBe('-1');
    }
  });
});
