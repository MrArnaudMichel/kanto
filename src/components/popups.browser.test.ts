/**
 * Every element that opens a panel, inside a container that clips its
 * overflow — a table cell, a side panel, an app's scrolling main area.
 *
 * The panels are popovers in the top layer, placed from their trigger, so no
 * ancestor's overflow can cut them off, and they open above the trigger when
 * there is no room below.
 */
import { describe, expect, it } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../styles.css';
import '../index.js';
import type { KtDatePicker, KtDropdown, KtMultiSelect, KtSelect } from 'kanto-ds';

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
  'kt-multi-select': {
    markup: '<kt-multi-select label="Countries"></kt-multi-select>',
    setup: (el) => {
      (el as KtMultiSelect).options = OPTIONS;
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

  it('keeps a panel on screen when its content grows after it opens', async () => {
    // The period picker's two months draw a moment after its panel is placed:
    // measured at opening, the panel looked narrow enough to fit, then grew.
    await page.viewport(1000, 800);
    const row = await fixture<HTMLDivElement>(
      '<div style="display: flex; justify-content: flex-end"><kt-date-picker range locale="en-GB" style="width: 280px"></kt-date-picker></div>',
    );
    const el = row.querySelector('kt-date-picker')!;
    await userEvent.click(shadow(el, '.trigger'));
    await settle(el);
    await settle(el.shadowRoot!.querySelector('kt-calendar'));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    const panel = shadow(el, '.panel').getBoundingClientRect();
    expect(panel.right).toBeLessThanOrEqual(window.innerWidth);
    expect(panel.left).toBeGreaterThanOrEqual(0);
  });

  it('fits a period picker on a phone, with one month and the periods above it', async () => {
    await page.viewport(390, 800);
    const el = await fixture<KtDatePicker>(
      '<kt-date-picker range locale="en-GB" style="width: 300px"></kt-date-picker>',
    );
    await userEvent.click(shadow(el, '.trigger'));
    await settle(el);
    await settle(el.shadowRoot!.querySelector('kt-calendar'));
    await new Promise((resolve) => requestAnimationFrame(resolve));

    expect(el.shadowRoot!.querySelector('kt-calendar')!.months).toBe(1);
    const panel = shadow(el, '.panel').getBoundingClientRect();
    expect(panel.left).toBeGreaterThanOrEqual(0);
    expect(panel.right).toBeLessThanOrEqual(390);
  });

  describe('stand apart from the page', () => {
    /** Relative luminance of a computed rgb() colour. */
    const luminance = (colour: string) => {
      const [r, g, b] = colour
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map(Number) as [number, number, number];
      const channel = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };
    const pageColour = () => getComputedStyle(document.body).backgroundColor;

    for (const theme of ['dark', 'light'] as const) {
      for (const name of Object.keys(POPUPS)) {
        it(`${name}, ${theme}`, async () => {
          document.documentElement.dataset['theme'] = theme;
          try {
            const { el } = await mount(name, 'margin-top: 20px');
            const style = getComputedStyle(shadow(el, POPUPS[name]!.panel));

            if (theme === 'dark') {
              // Elevation as a lighter surface: the panel is lighter than the page.
              expect(luminance(style.backgroundColor)).toBeGreaterThan(luminance(pageColour()));
            } else {
              // A white panel on a near-white page: an edge and a shadow set it apart.
              expect(luminance(style.backgroundColor)).toBeGreaterThanOrEqual(
                luminance(pageColour()),
              );
              expect(parseFloat(style.borderTopWidth)).toBeGreaterThan(0);
              expect(style.borderTopColor).not.toMatch(/rgba\(.*, 0\)|transparent/);
              expect(style.boxShadow).not.toBe('none');
            }
          } finally {
            delete document.documentElement.dataset['theme'];
          }
        });
      }
    }
  });
});
