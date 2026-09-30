/**
 * Every element that opens a panel, inside a container that clips its
 * overflow — a table cell, a side panel, an app's scrolling main area.
 *
 * The panels are popovers in the top layer, placed from their trigger, so no
 * ancestor's overflow can cut them off, and they open above the trigger when
 * there is no room below.
 */
import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../styles.css';
import '../index.js';
import type { KtDropdown, KtSelect } from 'kanto-ds';

const OPTIONS = [
  { id: 'fr', label: 'France' },
  { id: 'be', label: 'Belgium' },
  { id: 'ch', label: 'Switzerland' },
];

interface Case {
  markup: string;
  /** Opens the panel the way a user would. */
  open: (el: HTMLElement) => void;
  panel: string;
  setup?: (el: HTMLElement) => void;
}

const shadow = (el: HTMLElement, selector: string) =>
  el.shadowRoot!.querySelector<HTMLElement>(selector)!;

const POPUPS: Record<string, Case> = {
  'kt-select': {
    markup: '<kt-select label="Country"></kt-select>',
    setup: (el) => {
      (el as KtSelect).options = OPTIONS;
    },
    open: (el) => shadow(el, '.trigger').click(),
    panel: '.popup',
  },
  'kt-input-menu': {
    markup: '<kt-input-menu label="Country"></kt-input-menu>',
    setup: (el) => {
      (el as KtSelect).options = OPTIONS;
    },
    open: (el) => shadow(el, '.toggle').click(),
    panel: '.popup',
  },
  'kt-date-picker': {
    markup: '<kt-date-picker label="Due" value="2026-09-14"></kt-date-picker>',
    open: (el) => shadow(el, '.trigger').click(),
    panel: '.panel',
  },
  'kt-dropdown': {
    markup: '<kt-dropdown><button slot="trigger">Actions</button></kt-dropdown>',
    setup: (el) => {
      (el as KtDropdown).options = OPTIONS;
    },
    open: (el) => (el as KtDropdown).show(),
    panel: '.panel',
  },
  'kt-input type="tel"': {
    markup: '<kt-input type="tel" label="Phone"></kt-input>',
    open: (el) => shadow(el, '.country').click(),
    panel: '.country-panel',
  },
};

async function mount(name: string, style: string): Promise<{ el: HTMLElement; box: HTMLElement }> {
  const { markup, setup } = POPUPS[name]!;
  const box = await fixture<HTMLDivElement>(`<div style="${style}">${markup}</div>`);
  const el = box.firstElementChild as HTMLElement;
  setup?.(el);
  await settle(el);
  POPUPS[name]!.open(el);
  await settle(el);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return { el, box };
}

describe('popup panels', () => {
  for (const name of Object.keys(POPUPS)) {
    it(`${name} opens over a container that clips its overflow`, async () => {
      const { el, box } = await mount(name, 'overflow: hidden; height: 60px; margin-top: 20px');
      const panel = shadow(el, POPUPS[name]!.panel);

      expect(panel.matches(':popover-open')).toBe(true);
      // Drawn below the container's clipped bottom edge, and on screen.
      const rect = panel.getBoundingClientRect();
      expect(rect.bottom).toBeGreaterThan(box.getBoundingClientRect().bottom);
      expect(rect.bottom).toBeLessThanOrEqual(window.innerHeight);
    });

    it(`${name} opens above its trigger at the bottom of the screen`, async () => {
      const { el } = await mount(name, 'position: fixed; bottom: 8px; left: 8px');
      const panel = shadow(el, POPUPS[name]!.panel);

      expect(panel.getBoundingClientRect().bottom).toBeLessThanOrEqual(
        el.getBoundingClientRect().top,
      );
    });
  }
});
