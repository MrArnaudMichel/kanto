/**
 * The home page, audited by axe in both themes: it is the first page a
 * visitor sees, and it is built from the components it advertises.
 */
import axe from 'axe-core';
import { render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import { settle } from '#test/fixture';
import 'kanto-ds/styles.css';
import '../shell.css';
import '../home.css';
import { KT_DEFAULT_APPEARANCE } from 'kanto-ds';
import { homePage } from './home.js';
import { TEMPLATES } from '../templates/index.js';

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

  it('loads a page miniature only as it nears the screen, and keeps it out of the tab order', async () => {
    // Below 720px the miniatures are not drawn, and so never load.
    await page.viewport(1280, 800);
    const host = document.body.appendChild(document.createElement('main'));
    render(
      homePage({ appearance: KT_DEFAULT_APPEARANCE, onUse: () => {}, rerender: () => {} }),
      host,
    );
    const frames = [...host.querySelectorAll('iframe')];
    // Every template, then the four apps.
    expect(frames.length).toBe(TEMPLATES.length + 4);
    for (const frame of frames) {
      expect(frame.hasAttribute('inert')).toBe(true);
      expect(frame.getAttribute('tabindex')).toBe('-1');
    }
    // Far below the fold: nothing booted yet.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(frames.every((frame) => !frame.getAttribute('src'))).toBe(true);

    frames[0]!.scrollIntoView();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(frames[0]!.getAttribute('src')).toContain('#/template/');
    frames.at(-1)!.scrollIntoView();
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(frames.at(-1)!.getAttribute('src')).toContain('#/app/');
  });
});

describe('the stage, on a phone', () => {
  it('keeps every control inside its panel', async () => {
    await page.viewport(390, 800);
    const host = document.body.appendChild(document.createElement('main'));
    host.className = 'home-main';
    render(
      homePage({ appearance: KT_DEFAULT_APPEARANCE, onUse: () => {}, rerender: () => {} }),
      host,
    );
    await Promise.all(
      [...host.querySelectorAll('*')]
        .filter((el) => el.localName.startsWith('kt-'))
        .map((el) => settle(el)),
    );
    await new Promise((resolve) => requestAnimationFrame(resolve));
    for (const panel of host.querySelectorAll('.stage-panel')) {
      const box = panel.getBoundingClientRect();
      for (const child of panel.querySelectorAll(':scope > *, kt-label-input > *')) {
        const inner = child.getBoundingClientRect();
        expect(inner.right, child.localName).toBeLessThanOrEqual(box.right + 0.5);
      }
    }
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(390);
  });
});

describe('the Customise invitation', () => {
  it('stays inside the page beside a right-hand button', () => {
    const bar = document.body.appendChild(document.createElement('div'));
    bar.style.cssText = 'display: flex; justify-content: flex-end; width: 100%';
    bar.innerHTML = `<div class="header-actions"><button>Customise</button><button>GitHub</button>
      <div class="customise-invite" role="status">Try Kanto in your colours <button>x</button></div></div>`;
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  });
});
