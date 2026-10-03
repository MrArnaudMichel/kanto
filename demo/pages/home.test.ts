import { render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetStage } from '../lib/stage.js';
import { KT_ACCENTS, KT_DEFAULT_APPEARANCE } from 'kanto-ds';
import { COMPONENTS } from '../lib/registry.js';
import { TEMPLATES } from '../templates/index.js';
import { homePage } from './home.js';

function mount() {
  const host = document.body.appendChild(document.createElement('main'));
  const draw = () =>
    render(homePage({ appearance: KT_DEFAULT_APPEARANCE, onUse: () => {}, rerender: draw }), host);
  draw();
  return host;
}

afterEach(() => {
  document.body.replaceChildren();
  resetStage();
});

describe('the home page hero', () => {
  it('shows a product, not code', () => {
    const hero = mount().querySelector('.home-hero')!;
    expect(hero.querySelector('kt-code, pre, code')).toBeNull();
    expect(hero.querySelector('h1')!.textContent).toMatch(/\S/);
  });

  it('opens on a live product screen built from Kanto', () => {
    const stage = mount().querySelector('.home-hero .stage')!;
    for (const tag of ['kt-stat', 'kt-chart', 'kt-table', 'kt-avatar']) {
      expect(stage.querySelector(tag), tag).not.toBeNull();
    }
    expect(stage.querySelector('kt-button[icon="send"]')).not.toBeNull();
  });

  it('re-colours that screen alone from one row of colours', async () => {
    const host = mount();
    const swatches = [...host.querySelectorAll<HTMLElement>('.home-hero [data-accent-id]')];
    expect(swatches.map((swatch) => swatch.dataset['accentId'])).toEqual(
      KT_ACCENTS.map((accent) => accent.id),
    );
    expect(host.querySelector('.home-hero [role="radiogroup"]')).not.toBeNull();
    swatches.find((swatch) => swatch.dataset['accentId'] === 'teal')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(host.querySelector<HTMLElement>('.stage')!.dataset['accent']).toBe('teal');
    expect(document.documentElement.dataset['accent']).toBeUndefined();
    expect(
      host.querySelector('.home-hero [data-accent-id="teal"]')!.getAttribute('aria-checked'),
    ).toBe('true');
  });

  it('starts people off: the guide, the install command, a live project', () => {
    const actions = mount().querySelector('.home-hero .home-actions')!.textContent!;
    expect(actions).toContain('Get started');
    expect(actions).toContain('npm install kanto-ds');
  });
});

describe('the stage, used', () => {
  const stat = (host: Element, label: string) =>
    host.querySelector(`.stage kt-stat[label="${label}"]`)!.getAttribute('value');

  it('changes its figures and chart with the period', async () => {
    const host = mount();
    const monthly = stat(host, 'Revenue');
    const period = host.querySelector<HTMLElement & { value: string }>(
      '.stage-head kt-segmented-control',
    )!;
    period.value = 'year';
    period.dispatchEvent(new CustomEvent('kt-change', { detail: { value: 'year' } }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(stat(host, 'Revenue')).not.toBe(monthly);
    const chart = host.querySelector<HTMLElement & { labels: string[] }>('.stage kt-chart')!;
    expect(chart.labels.length).toBeGreaterThan(6);
  });

  it('opens each page of its sidebar, and marks where it is', async () => {
    const host = mount();
    const expectations: Record<string, string> = {
      Invoices: 'kt-table',
      Customers: 'kt-avatar',
      Reports: 'kt-meter',
      Settings: 'kt-toggle',
      Overview: 'kt-stat',
    };
    for (const [page, tag] of Object.entries(expectations)) {
      const link = [...host.querySelectorAll<HTMLElement>('.stage-nav a')].find(
        (candidate) => candidate.textContent!.trim() === page,
      )!;
      link.click();
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(host.querySelector('.stage-title')!.textContent!.trim(), page).toBe(page);
      expect(host.querySelector(`.stage-main ${tag}`), `${page} shows ${tag}`).not.toBeNull();
      expect(link.getAttribute('aria-current'), page).toBe('page');
      expect(host.querySelectorAll('.stage-nav a[aria-current="page"]')).toHaveLength(1);
    }
  });

  it('filters its invoices page by status', async () => {
    const host = mount();
    [...host.querySelectorAll<HTMLElement>('.stage-nav a')]
      .find((link) => link.textContent!.trim() === 'Invoices')!
      .click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const filter = host.querySelector<HTMLElement>('.stage-main kt-segmented-control')!;
    filter.dispatchEvent(new CustomEvent('kt-change', { detail: { value: 'Overdue' } }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    const table = host.querySelector<HTMLElement & { data: { status: string }[] }>(
      '.stage-main kt-table',
    )!;
    expect(table.data.length).toBeGreaterThan(0);
    expect(table.data.every((row) => row.status === 'Overdue')).toBe(true);
  });

  it('searches its own table', async () => {
    const host = mount();
    const search = host.querySelector('.stage-search')!;
    search.dispatchEvent(new CustomEvent('kt-input', { detail: { value: 'glob' } }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    const table = host.querySelector<HTMLElement & { data: { customer: string }[] }>(
      '.stage kt-table',
    )!;
    expect(table.data.length).toBeGreaterThan(0);
    expect(table.data.every((row) => row.customer === 'Globex')).toBe(true);
    search.dispatchEvent(new CustomEvent('kt-clear'));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(table.data.length).toBeGreaterThan(1);
  });

  it('adds the invoice it sends to the table, and counts it', async () => {
    vi.useFakeTimers();
    try {
      const host = mount();
      const before = Number(stat(host, 'Invoices sent')!.replace(/\D/g, ''));
      const table = host.querySelector<
        HTMLElement & { data: { customer: string; status: string }[] }
      >('.stage kt-table')!;
      const newest = (table.data[0] as unknown as { id: string }).id;
      host.querySelector<HTMLElement>('.stage-send kt-button')!.click();
      await vi.advanceTimersByTimeAsync(5000);
      // The recent invoices: the one just sent on top.
      expect(table.data[0]).toMatchObject({ customer: 'Acme Corp', status: 'Pending' });
      expect((table.data[0] as unknown as { id: string }).id).not.toBe(newest);
      expect(Number(stat(host, 'Invoices sent')!.replace(/\D/g, ''))).toBe(before + 1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('the reasons', () => {
  it('makes three points, each shown by a live example', () => {
    const reasons = [...mount().querySelectorAll('.home-reason')];
    expect(reasons).toHaveLength(3);
    for (const reason of reasons) {
      expect(reason.querySelector('h3')!.textContent).toMatch(/\S/);
      const demo = reason.querySelector('.home-reason-demo')!;
      expect(
        [...demo.querySelectorAll('*')].some((el) => el.localName.startsWith('kt-')),
        reason.querySelector('h3')!.textContent!,
      ).toBe(true);
    }
  });

  it('turns the plane into a spinner, for real, in the motion example', () => {
    expect(mount().querySelector('.home-reason kt-button[icon="send"]')).not.toBeNull();
  });
});

describe('the gallery', () => {
  it('links every component it names to its page', () => {
    const slugs = new Set(COMPONENTS.map((entry) => entry.slug));
    const links = [
      ...mount().querySelectorAll<HTMLAnchorElement>('.home-gallery a[href^="#/components/"]'),
    ];
    expect(links.length).toBeGreaterThanOrEqual(20);
    for (const link of links) {
      expect(slugs.has(link.getAttribute('href')!.replace('#/components/', '')), link.href).toBe(
        true,
      );
    }
  });
});

describe('whole screens', () => {
  it('shows every template, linked to its page', () => {
    const links = [
      ...mount().querySelectorAll<HTMLAnchorElement>('.home-screens a[href^="#/templates/"]'),
    ];
    expect(links.map((link) => link.getAttribute('href'))).toEqual(
      TEMPLATES.map((template) => `#/templates/${template.slug}`),
    );
  });
});

describe('for AI agents', () => {
  it('shows each agent the one line it needs, and leads to the guide', async () => {
    const host = mount();
    const section = host.querySelector('.home-agents')!;
    expect(section.querySelector('h2')!.textContent).toMatch(/agent/i);
    const tabs = section.querySelector<HTMLElement & { tabs: { label: string }[] }>('kt-tabs')!;
    expect(tabs.tabs.map((tab) => tab.label)).toEqual([
      'Claude Code',
      'Cursor',
      'GitHub Copilot',
      'Any agent',
    ]);
    expect(section.textContent).toContain('@node_modules/kanto-ds/dist/AGENTS.md');
    tabs.dispatchEvent(new CustomEvent('kt-change', { detail: { value: 'cursor' } }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(section.textContent).toContain('.cursor/rules/kanto.mdc');
    expect(section.querySelector('a[href="#/guide/ai-agents"]')).not.toBeNull();
    expect(section.querySelector('a[href$="llms-full.txt"]')).not.toBeNull();
  });
});

describe('the questions', () => {
  it('answers the usual objections, each in a fold of its own', () => {
    const folds = [...mount().querySelectorAll('.home-faq kt-collapsible')];
    expect(folds.length).toBeGreaterThanOrEqual(5);
    const headings = folds.map((fold) => fold.getAttribute('heading')!.toLowerCase()).join(' | ');
    for (const topic of ['server', 'size', 'licen', 'one component', 'accessib']) {
      expect(headings, topic).toContain(topic);
    }
  });
});

describe('the way in', () => {
  it('reassures under the hero: free, open, any framework', () => {
    const note = mount().querySelector('.home-hero .home-note')!.textContent!;
    expect(note).toMatch(/MIT/);
    expect(note).toMatch(/React/);
  });

  it('ends on one clear action, the command beside it, and three steps', () => {
    const end = mount().querySelector('.home-cta')!;
    const primary = end.querySelector('kt-button:not([variant])')!;
    expect(primary.textContent!.trim()).toBe('Get started');
    expect(end.querySelector('.home-install')!.textContent).toContain('npm install kanto-ds');
    expect(end.querySelectorAll('.home-steps li')).toHaveLength(3);
  });

  it('closes with a footer that leads everywhere, agents included', () => {
    const footer = mount().querySelector('footer.home-footer')!;
    const hrefs = [...footer.querySelectorAll('a')].map((link) => link.getAttribute('href'));
    for (const href of [
      '#/guide/installation',
      '#/components/kt-button',
      '#/guide/ai-agents',
      'llms.txt',
      '#/release/releases',
    ]) {
      expect(hrefs, href).toContain(href);
    }
    expect(hrefs.some((href) => href?.includes('github.com'))).toBe(true);
    expect(hrefs.some((href) => href?.includes('npmjs.com'))).toBe(true);
  });
});

describe('the end of the page', () => {
  it('closes on a way to start: the command, StackBlitz and the guide', () => {
    const end = mount().querySelector('.home-cta')!;
    expect(end.textContent).toContain('npm install kanto-ds');
    expect(end.textContent).toContain('StackBlitz');
    expect(end.textContent).toContain('Get started');
  });
});
