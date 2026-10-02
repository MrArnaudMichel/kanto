/**
 * The palette with a real keyboard and a real <dialog>: the top layer, where
 * the focus goes and comes back, only a browser shows.
 */
import { describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-command-palette.js';
import type { KtCommandPalette } from 'kanto-ds';

const COMMANDS = [
  { id: 'new-invoice', label: 'New invoice', group: 'Create' },
  { id: 'settings', label: 'Open settings', group: 'Navigate', keywords: ['preferences'] },
];

function deepActive(): Element | null {
  let active = document.activeElement;
  while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
  return active;
}

describe('kt-command-palette, for real', () => {
  it('opens over the page on Ctrl+K, takes the focus, runs what is typed and gives the focus back', async () => {
    const row = await fixture<HTMLDivElement>(
      '<div><button id="before">Before</button><kt-command-palette></kt-command-palette></div>',
    );
    const palette = row.querySelector<KtCommandPalette>('kt-command-palette')!;
    palette.commands = COMMANDS;
    const before = row.querySelector<HTMLButtonElement>('#before')!;
    before.focus();
    const selected = vi.fn();
    palette.addEventListener('kt-select', selected);

    await userEvent.keyboard('{Control>}k{/Control}');
    await settle(palette);
    const dialog = palette.shadowRoot!.querySelector('dialog')!;
    expect(dialog.matches(':modal')).toBe(true);
    expect(deepActive()).toBe(palette.shadowRoot!.querySelector('input'));

    await userEvent.keyboard('prefer');
    await userEvent.keyboard('{Enter}');
    await settle(palette);
    expect(selected.mock.calls[0]![0].detail.id).toBe('settings');
    expect(dialog.open).toBe(false);
    expect(deepActive()).toBe(before);
  });

  it('closes on a click outside it', async () => {
    const palette = await fixture<KtCommandPalette>(
      '<kt-command-palette open></kt-command-palette>',
    );
    palette.commands = COMMANDS;
    await settle(palette);
    await userEvent.click(document.body, { position: { x: 5, y: 5 } });
    await settle(palette);
    expect(palette.open).toBe(false);
  });
});
