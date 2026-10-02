import { render } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { resetShowcase, showcase } from './showcase.js';

function mount() {
  const host = document.body.appendChild(document.createElement('div'));
  const draw = () => render(showcase(draw), host);
  draw();
  return host;
}

afterEach(() => {
  resetShowcase();
  document.body.replaceChildren();
  document.documentElement.removeAttribute('data-accent');
});

describe('the showcase wall', () => {
  it('is a wall of real screens, each built from Kanto elements', () => {
    const cards = [...mount().querySelectorAll('.showcase-wall > .showcase-card')];
    expect(cards.length).toBeGreaterThanOrEqual(14);
    for (const card of cards) {
      expect([...card.querySelectorAll('*')].some((el) => el.localName.startsWith('kt-'))).toBe(
        true,
      );
    }
  });

  it('uses the breadth of the system, not three components over and over', () => {
    const tags = new Set(
      [...mount().querySelectorAll('.showcase-wall *')]
        .map((el) => el.localName)
        .filter((name) => name.startsWith('kt-')),
    );
    expect(tags.size).toBeGreaterThanOrEqual(20);
  });

  it('re-themes the wall alone, from presets above it', () => {
    const host = mount();
    host
      .querySelector('kt-segmented-control[label="Theme of the examples"]')!
      .dispatchEvent(
        new CustomEvent('kt-change', { detail: { value: 'teal-round' }, bubbles: true }),
      );
    const wall = host.querySelector<HTMLElement>('.showcase-wall')!;
    expect(wall.dataset['accent']).toBe('teal');
    expect(wall.dataset['radius']).toBe('round');
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false);
  });
});
