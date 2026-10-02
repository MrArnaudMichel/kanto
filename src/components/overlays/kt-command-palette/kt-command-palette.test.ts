import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-command-palette.js';
import type { KtCommandPalette } from 'kanto-ds';

const COMMANDS = [
  { id: 'new-invoice', label: 'New invoice', group: 'Create', shortcut: 'mod i' },
  { id: 'new-customer', label: 'New customer', group: 'Create', keywords: ['client'] },
  { id: 'export', label: 'Export as CSV', group: 'Actions', disabled: true },
  { id: 'settings', label: 'Open settings', group: 'Navigate', icon: 'settings' },
];

async function mount(attributes = 'open') {
  const el = await fixture<KtCommandPalette>(
    `<kt-command-palette ${attributes}></kt-command-palette>`,
  );
  el.commands = COMMANDS;
  await settle(el);
  return el;
}

const root = (el: KtCommandPalette) => el.shadowRoot!;
const input = (el: KtCommandPalette) => root(el).querySelector('input')!;
const options = (el: KtCommandPalette) => [...root(el).querySelectorAll('[role="option"]')];
const active = (el: KtCommandPalette) =>
  root(el).getElementById(input(el).getAttribute('aria-activedescendant') ?? '');

async function type(el: KtCommandPalette, text: string) {
  input(el).value = text;
  input(el).dispatchEvent(new Event('input'));
  await settle(el);
}
async function key(el: KtCommandPalette, name: string) {
  input(el).dispatchEvent(
    new KeyboardEvent('keydown', { key: name, bubbles: true, composed: true }),
  );
  await settle(el);
}

afterEach(() => vi.restoreAllMocks());

describe('kt-command-palette', () => {
  it('stays closed until opened', async () => {
    const el = await mount('');
    expect(root(el).querySelector('dialog')!.hasAttribute('open')).toBe(false);
  });

  it('lists the commands under their groups, the first one active', async () => {
    const el = await mount();
    const groups = [...root(el).querySelectorAll('[role="group"]')].map((g) =>
      g.getAttribute('aria-label'),
    );
    expect(groups).toEqual(['Create', 'Actions', 'Navigate']);
    expect(options(el)).toHaveLength(4);
    expect(active(el)!.textContent).toContain('New invoice');
    expect(input(el).getAttribute('role')).toBe('combobox');
  });

  it('narrows the list as you type, best match first', async () => {
    const el = await mount();
    await type(el, 'client');
    expect(options(el).map((o) => o.textContent!.trim())).toEqual([
      expect.stringContaining('New customer'),
    ]);
    expect(active(el)!.textContent).toContain('New customer');
  });

  it('moves with the arrows, skipping what is disabled and wrapping', async () => {
    const el = await mount();
    await key(el, 'ArrowDown');
    expect(active(el)!.textContent).toContain('New customer');
    await key(el, 'ArrowDown');
    expect(active(el)!.textContent).toContain('Open settings');
    await key(el, 'ArrowDown');
    expect(active(el)!.textContent).toContain('New invoice');
    await key(el, 'ArrowUp');
    expect(active(el)!.textContent).toContain('Open settings');
  });

  it('runs the active command on Enter, and closes', async () => {
    const el = await mount();
    const selected = vi.fn();
    el.addEventListener('kt-select', selected);
    await key(el, 'ArrowDown');
    await key(el, 'Enter');
    expect(selected).toHaveBeenCalledOnce();
    expect(selected.mock.calls[0]![0].detail.id).toBe('new-customer');
    expect(selected.mock.calls[0]![0].detail.command.label).toBe('New customer');
    expect(el.open).toBe(false);
  });

  it('runs a command on click, but never a disabled one', async () => {
    const el = await mount();
    const selected = vi.fn();
    el.addEventListener('kt-select', selected);
    (options(el)[2] as HTMLElement).click();
    expect(selected).not.toHaveBeenCalled();
    (options(el)[3] as HTMLElement).click();
    expect(selected.mock.calls[0]![0].detail.id).toBe('settings');
  });

  it('says so when nothing matches', async () => {
    const el = await mount();
    await type(el, 'zzz');
    expect(options(el)).toHaveLength(0);
    expect(root(el).querySelector('.empty')!.textContent).toContain('No results');
    expect(input(el).hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('closes on Escape, and says it closed', async () => {
    const el = await mount();
    const closed = vi.fn();
    el.addEventListener('kt-close', closed);
    await key(el, 'Escape');
    expect(el.open).toBe(false);
    expect(closed).toHaveBeenCalledOnce();
  });

  it('starts afresh each time it opens', async () => {
    const el = await mount();
    await type(el, 'client');
    el.open = false;
    await settle(el);
    el.open = true;
    await settle(el);
    expect(input(el).value).toBe('');
    expect(options(el)).toHaveLength(4);
  });

  it('opens on its hotkey, with Ctrl or Cmd, and not when the hotkey is off', async () => {
    const el = await mount('');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    await settle(el);
    expect(el.open).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
    await settle(el);
    expect(el.open).toBe(false);

    const quiet = await mount('hotkey=""');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    await settle(quiet);
    expect(quiet.open).toBe(false);
  });

  it('shows a shortcut beside the command that has one', async () => {
    const el = await mount();
    expect(options(el)[0]!.querySelector('kt-kbd')!.getAttribute('keys')).toBe('mod i');
  });

  it('says aloud that nothing matches', async () => {
    const el = await mount();
    await type(el, 'zzz');
    expect(root(el).querySelector('[role="status"]')!.textContent).toContain('No results');
  });

  it('ignores a key event without a key, one already handled, and a held key', async () => {
    const el = await mount('');
    expect(() =>
      document.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true })),
    ).not.toThrow();
    const handled = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, cancelable: true });
    handled.preventDefault();
    document.dispatchEvent(handled);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, repeat: true }));
    await settle(el);
    expect(el.open).toBe(false);
  });

  it('follows its dialog when the browser closes it', async () => {
    const el = await mount();
    root(el).querySelector('dialog')!.dispatchEvent(new Event('close'));
    await settle(el);
    expect(el.open).toBe(false);
  });
});
