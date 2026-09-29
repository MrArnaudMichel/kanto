/**
 * Every form control under a disabled `<fieldset>`, in a real browser.
 *
 * The fieldset disables what it contains through `formDisabledCallback`, which
 * neither happy-dom nor jsdom calls. The control's own `disabled` stays false
 * throughout, so an element that only reads its property looks enabled and
 * stays reachable — the failure this suite exists to catch.
 */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../styles.css';
import '../index.js';
import type { KtSegmentedControl, KtSelect } from 'kanto-ds';

interface Case {
  markup: string;
  setup?: (el: HTMLElement) => void;
}

const CONTROLS: Record<string, Case> = {
  'kt-input': { markup: '<kt-input label="Name"></kt-input>' },
  'kt-input type="tel"': { markup: '<kt-input type="tel" label="Phone"></kt-input>' },
  'kt-textarea': { markup: '<kt-textarea label="Notes"></kt-textarea>' },
  'kt-select': {
    markup: '<kt-select label="Country"></kt-select>',
    setup: (el) => {
      (el as KtSelect).options = [{ id: 'fr', label: 'France' }];
    },
  },
  'kt-input-menu': { markup: '<kt-input-menu label="Owner"></kt-input-menu>' },
  'kt-date-picker': { markup: '<kt-date-picker label="Due"></kt-date-picker>' },
  'kt-checkbox': { markup: '<kt-checkbox>Send me updates</kt-checkbox>' },
  'kt-toggle': { markup: '<kt-toggle>Notifications</kt-toggle>' },
  'kt-radio-group': {
    markup: `<kt-radio-group label="Billing" value="yearly">
      <kt-radio value="monthly">Monthly</kt-radio>
      <kt-radio value="yearly">Yearly</kt-radio>
    </kt-radio-group>`,
  },
  'kt-segmented-control': {
    markup: '<kt-segmented-control label="Range" value="day"></kt-segmented-control>',
    setup: (el) => {
      (el as KtSegmentedControl).options = [
        { value: 'day', label: 'Day' },
        { value: 'week', label: 'Week' },
      ];
    },
  },
  'kt-drag-drop': { markup: '<kt-drag-drop label="Attachments"></kt-drag-drop>' },
};

/** The element that has focus, looking through shadow roots. */
function deepActive(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

/** Whether `node` is `host` or inside it, crossing shadow boundaries. */
function isWithin(node: Node | null, host: Element): boolean {
  while (node) {
    if (node === host) return true;
    node = node.parentNode ?? (node instanceof ShadowRoot ? node.host : null);
  }
  return false;
}

/** Everything Kanto renders for `control`, including slotted `kt-radio`s. */
async function settleAll(control: HTMLElement): Promise<void> {
  await settle(control);
  for (const child of control.querySelectorAll('*')) await settle(child);
}

describe('form controls under a disabled fieldset', () => {
  for (const [name, { markup, setup }] of Object.entries(CONTROLS)) {
    it(`${name} leaves the tab order, and comes back when the fieldset does`, async () => {
      const root = await fixture<HTMLDivElement>(
        `<div><button>Before</button><fieldset disabled>${markup}</fieldset><button>After</button></div>`,
      );
      const [before, after] = root.querySelectorAll(':scope > button');
      const fieldset = root.querySelector('fieldset')!;
      const control = fieldset.firstElementChild as HTMLElement;
      setup?.(control);
      await settleAll(control);

      expect(control.matches(':disabled')).toBe(true);
      (before as HTMLButtonElement).focus();
      await userEvent.tab();
      expect(deepActive()).toBe(after);

      fieldset.disabled = false;
      await settleAll(control);

      (before as HTMLButtonElement).focus();
      await userEvent.tab();
      expect(isWithin(deepActive(), control)).toBe(true);
    });
  }

  it('keeps a control its author disabled disabled when the fieldset re-enables', async () => {
    const root = await fixture<HTMLDivElement>(
      '<div><button>Before</button><fieldset disabled><kt-input label="Name" disabled></kt-input></fieldset><button>After</button></div>',
    );
    const [before, after] = root.querySelectorAll(':scope > button');
    const fieldset = root.querySelector('fieldset')!;
    fieldset.disabled = false;
    await settle(fieldset.firstElementChild);

    (before as HTMLButtonElement).focus();
    await userEvent.tab();
    expect(deepActive()).toBe(after);
  });
});
