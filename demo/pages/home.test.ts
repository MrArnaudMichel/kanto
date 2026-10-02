import { render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { KT_ACCENTS, KT_DEFAULT_APPEARANCE } from 'kanto-ds';
import { COMPONENTS } from '../lib/registry.js';
import { homePage } from './home.js';

function mount() {
  const host = document.body.appendChild(document.createElement('main'));
  render(
    homePage({ appearance: KT_DEFAULT_APPEARANCE, onUse: () => {}, rerender: () => {} }),
    host,
  );
  return host;
}

afterEach(() => document.body.replaceChildren());

describe('the home page hero', () => {
  it('shows real components beside the code that makes them', () => {
    const specimens = [...mount().querySelectorAll('.home-specimen')];
    expect(specimens.length).toBe(3);
    for (const specimen of specimens) {
      const tag = specimen.querySelector('kt-code')!.textContent!.match(/<(kt-[a-z-]+)/)![1]!;
      expect(specimen.querySelector(`.home-specimen-live ${tag}`), tag).not.toBeNull();
    }
  });

  it('states only facts the site can count', () => {
    const facts = mount().querySelector('.home-facts')!.textContent!.replace(/\s+/g, ' ');
    expect(facts).toContain(`${COMPONENTS.length} components`);
    expect(facts).toContain(`${KT_ACCENTS.length} accents`);
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
