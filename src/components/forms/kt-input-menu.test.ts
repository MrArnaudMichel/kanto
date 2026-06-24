import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '../../test/fixture.js';
import './kt-input-menu.js';
import type { KtInputMenu } from './kt-input-menu.js';
import type { KtOption } from '../../internal/listbox.js';

const OPTIONS: KtOption[] = [
  { id: 'fr', label: 'France' },
  { id: 'be', label: 'Belgique' },
  { id: 'ch', label: 'Suisse' },
];

const input = (el: KtInputMenu) => el.shadowRoot!.querySelector('input')!;
const popup = (el: KtInputMenu) => el.shadowRoot!.querySelector('.popup')!;
const rows = (el: KtInputMenu) => [...el.shadowRoot!.querySelectorAll<HTMLElement>('.option')];
const key = (el: KtInputMenu, k: string) =>
  input(el).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

async function typeQuery(el: KtInputMenu, text: string) {
  input(el).value = text;
  input(el).dispatchEvent(new Event('input', { bubbles: true }));
  await settle(el);
}

describe('kt-input-menu', () => {
  let el: KtInputMenu;

  beforeEach(async () => {
    el = await fixture<KtInputMenu>('<kt-input-menu placeholder="Pays"></kt-input-menu>');
    el.options = OPTIONS;
    await settle(el);
  });

  it('opens on focus and lists everything', async () => {
    input(el).dispatchEvent(new FocusEvent('focus'));
    await settle(el);

    expect(popup(el).classList.contains('open')).toBe(true);
    expect(rows(el)).toHaveLength(3);
  });

  it('narrows the list as the user types and announces the query', async () => {
    const filtered = vi.fn();
    el.addEventListener('kt-filter', filtered);

    await typeQuery(el, 'sui');

    expect(rows(el)).toHaveLength(1);
    expect(rows(el)[0]!.textContent).toContain('Suisse');
    expect(filtered.mock.calls[0]![0].detail.query).toBe('sui');
  });

  it('says so when nothing matches', async () => {
    await typeQuery(el, 'atlantide');
    expect(rows(el)).toHaveLength(0);
    expect(el.shadowRoot!.querySelector('.empty')!.textContent).toContain('Aucune option');
  });

  it('chooses an option, clears the query and shows the label', async () => {
    const listener = vi.fn();
    el.addEventListener('kt-change', listener);

    await typeQuery(el, 'bel');
    rows(el)[0]!.click();
    await settle(el);

    expect(el.value).toBe('be');
    expect(input(el).value).toBe('Belgique');
    expect(popup(el).classList.contains('open')).toBe(false);
    expect(listener.mock.calls[0]![0].detail.value).toBe('be');
  });

  it('walks only the filtered options with the arrows', async () => {
    await typeQuery(el, 'i');
    expect(rows(el).map((row) => row.textContent!.trim())).toEqual(['Belgique', 'Suisse']);

    // The first match is active on open; one step down lands on the second.
    key(el, 'ArrowDown');
    await settle(el);
    expect(rows(el)[1]!.classList.contains('active')).toBe(true);

    key(el, 'Enter');
    await settle(el);
    expect(el.value).toBe('ch');
  });

  it('closes on Escape and forgets the query', async () => {
    await typeQuery(el, 'sui');
    key(el, 'Escape');
    await settle(el);

    expect(popup(el).classList.contains('open')).toBe(false);
    expect(input(el).value).toBe('');
  });

  it('clears the selection', async () => {
    el.value = 'fr';
    await settle(el);
    expect(input(el).value).toBe('France');

    el.shadowRoot!.querySelector<HTMLButtonElement>('.clear')!.click();
    await settle(el);

    expect(el.value).toBeNull();
    expect(input(el).value).toBe('');
  });

  it('closes on an outside pointer press', async () => {
    input(el).dispatchEvent(new FocusEvent('focus'));
    await settle(el);

    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    await settle(el);

    expect(popup(el).classList.contains('open')).toBe(false);
  });
});
