/**
 * Elements that close on an outside click listen on `document` — but only
 * while they are open. A table of two hundred editable rows is two hundred
 * closed fields, and each one listening would run two hundred handlers on
 * every click anywhere on the page.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../index.js';
import type { KtDropdown } from 'kanto-ds';

const CLOSED = {
  'kt-select': '<kt-select label="Country"></kt-select>',
  'kt-input-menu': '<kt-input-menu label="Owner"></kt-input-menu>',
  'kt-date-picker': '<kt-date-picker label="Due"></kt-date-picker>',
  'kt-dropdown': '<kt-dropdown><button slot="trigger">Menu</button></kt-dropdown>',
  'kt-input type="tel"': '<kt-input type="tel" label="Phone"></kt-input>',
};

/** The document and window listeners of `type` added while `action` runs. */
async function listenersAdded(type: string, action: () => Promise<unknown>): Promise<number> {
  const onDocument = vi.spyOn(document, 'addEventListener');
  const onWindow = vi.spyOn(window, 'addEventListener');
  await action();
  return [...onDocument.mock.calls, ...onWindow.mock.calls].filter(([t]) => t === type).length;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('outside-click listeners', () => {
  for (const [name, markup] of Object.entries(CLOSED)) {
    it(`${name} does not listen on the document while closed`, async () => {
      expect(await listenersAdded('pointerdown', () => fixture(markup))).toBe(0);
    });
  }

  it('listens while open, and stops once closed', async () => {
    const el = await fixture<KtDropdown>(CLOSED['kt-dropdown']);
    const removed = vi.spyOn(document, 'removeEventListener');

    expect(
      await listenersAdded('pointerdown', async () => {
        el.show();
        await settle(el);
      }),
    ).toBe(1);

    el.hide();
    await settle(el);
    expect(removed.mock.calls.filter(([type]) => type === 'pointerdown')).toHaveLength(1);
  });
});
