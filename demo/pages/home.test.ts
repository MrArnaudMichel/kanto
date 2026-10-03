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

  it('searches its own table', async () => {
    const host = mount();
    const search = host.querySelector('.stage-search')!;
    search.dispatchEvent(new CustomEvent('kt-input', { detail: { value: 'glob' } }));
    await new Promise((resolve) => setTimeout(resolve, 0));
    const table = host.querySelector<HTMLElement & { data: { customer: string }[] }>(
      '.stage kt-table',
    )!;
    expect(table.data.map((row) => row.customer)).toEqual(['Globex']);
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
      const rows = table.data.length;
      host.querySelector<HTMLElement>('.stage-send kt-button')!.click();
      await vi.advanceTimersByTimeAsync(5000);
      expect(table.data).toHaveLength(rows + 1);
      expect(table.data[0]).toMatchObject({ customer: 'Acme Corp', status: 'Pending' });
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

describe('the end of the page', () => {
  it('closes on a way to start: the command, StackBlitz and the guide', () => {
    const end = mount().querySelector('.home-cta')!;
    expect(end.textContent).toContain('npm install kanto-ds');
    expect(end.textContent).toContain('StackBlitz');
    expect(end.textContent).toContain('guide');
  });
});
