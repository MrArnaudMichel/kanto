import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-split-button.js';
import type { KtSplitButton, KtSplitButtonItem } from 'kanto-ds';
import type { KtDropdown } from 'kanto-ds';

const ITEMS: KtSplitButtonItem[] = [
  { id: 'close', label: 'Save and close' },
  { id: 'copy', label: 'Save a copy', disabled: true },
  { id: 'pdf', label: 'Export as PDF', icon: 'file-down' },
  { id: 'discard', label: 'Discard', variant: 'danger' },
];

const action = (el: KtSplitButton) => el.shadowRoot!.querySelector<HTMLElement>('.action')!;
const caret = (el: KtSplitButton) => el.shadowRoot!.querySelector<HTMLElement>('.caret')!;
const menu = (el: KtSplitButton) => el.shadowRoot!.querySelector<HTMLElement>('.menu')!;
const rows = (el: KtSplitButton) => [
  ...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.item'),
];
const dropdown = (el: KtSplitButton) => el.shadowRoot!.querySelector<KtDropdown>('kt-dropdown')!;

async function mount(attributes = ''): Promise<KtSplitButton> {
  const el = await fixture<KtSplitButton>(`<kt-split-button ${attributes}>Save</kt-split-button>`);
  el.items = ITEMS;
  await settle(el);
  return el;
}

describe('kt-split-button', () => {
  it('renders an action segment and a caret segment', async () => {
    const el = await mount();

    expect(action(el)).not.toBeNull();
    expect(caret(el)).not.toBeNull();
    expect(caret(el).getAttribute('label')).toBe('More actions');
  });

  it('announces the caret as opening a menu, and whether it is open', async () => {
    const el = await mount();
    const button = caret(el) as HTMLElement & { popup?: string; expanded?: boolean };
    expect(button.popup).toBe('menu');
    expect(button.expanded).toBe(false);

    dropdown(el).show();
    await settle(dropdown(el));
    expect(button.expanded).toBe(true);
  });

  it('renders one row per item, labelled', async () => {
    const el = await mount();

    expect(rows(el).map((row) => row.textContent!.trim())).toEqual([
      'Save and close',
      'Save a copy',
      'Export as PDF',
      'Discard',
    ]);
  });

  it('keeps the primary label beside its icon instead of collapsing to a square', async () => {
    const el = await mount('icon="check"');
    const native = action(el).shadowRoot!.querySelector('button')!;

    expect(native.classList.contains('icon-only')).toBe(false);
    expect(action(el).querySelector('kt-icon')).not.toBeNull();
  });

  it('lets a click on the action segment through as a plain click', async () => {
    const el = await mount();
    const onClick = vi.fn();
    el.addEventListener('click', onClick);

    action(el).click();
    await settle(el);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(el.isOpen).toBe(false);
  });

  it('does not report a caret press as a click on the button', async () => {
    const el = await mount();
    const onClick = vi.fn();
    el.addEventListener('click', onClick);

    caret(el).click();
    await settle(el);

    expect(onClick).not.toHaveBeenCalled();
    expect(el.isOpen).toBe(true);
  });

  it('opens and closes on the caret', async () => {
    const el = await mount();

    caret(el).click();
    await settle(el);
    expect(el.isOpen).toBe(true);

    caret(el).click();
    await settle(el);
    expect(el.isOpen).toBe(false);
  });

  it('closes on Escape and hands focus back to the caret', async () => {
    const el = await mount();
    const restored = vi.spyOn(caret(el), 'focus');

    el.show();
    await settle(el);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await settle(el);

    expect(el.isOpen).toBe(false);
    expect(restored).toHaveBeenCalled();
  });

  it('focuses the first selectable row when the menu opens', async () => {
    const el = await mount();

    el.show();
    await settle(el);

    expect(el.shadowRoot!.activeElement).toBe(rows(el)[0]);
  });

  it('walks the rows with the arrow keys, skipping the disabled ones', async () => {
    const el = await mount();
    el.show();
    await settle(el);

    menu(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await settle(el);
    expect(el.shadowRoot!.activeElement).toBe(rows(el)[2]);

    menu(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await settle(el);
    expect(el.shadowRoot!.activeElement).toBe(rows(el)[0]);
  });

  it('wraps at both ends', async () => {
    const el = await mount();
    el.show();
    await settle(el);

    menu(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }));
    await settle(el);
    expect(el.shadowRoot!.activeElement).toBe(rows(el)[3]);

    menu(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await settle(el);
    expect(el.shadowRoot!.activeElement).toBe(rows(el)[0]);
  });

  it('jumps to the first and last row with Home and End', async () => {
    const el = await mount();
    el.show();
    await settle(el);

    menu(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'End', bubbles: true }));
    await settle(el);
    expect(el.shadowRoot!.activeElement).toBe(rows(el)[3]);

    menu(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
    await settle(el);
    expect(el.shadowRoot!.activeElement).toBe(rows(el)[0]);
  });

  it('announces the chosen row and closes', async () => {
    const el = await mount();
    const onSelect = vi.fn();
    el.addEventListener('kt-select', onSelect);

    el.show();
    await settle(el);
    rows(el)[2]!.click();
    await settle(el);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect.mock.calls[0]![0].detail).toEqual({ value: 'pdf', item: ITEMS[2] });
    expect(el.isOpen).toBe(false);
  });

  it('ignores a disabled row', async () => {
    const el = await mount();
    const onSelect = vi.fn();
    el.addEventListener('kt-select', onSelect);

    el.show();
    await settle(el);
    rows(el)[1]!.click();
    await settle(el);

    expect(onSelect).not.toHaveBeenCalled();
    expect(el.isOpen).toBe(true);
  });

  it('marks a danger row so it does not read as an ordinary action', async () => {
    const el = await mount();

    expect(rows(el)[3]!.classList.contains('danger')).toBe(true);
    expect(rows(el)[0]!.classList.contains('danger')).toBe(false);
  });

  it('neutralises both segments when disabled', async () => {
    const el = await mount('disabled');
    const onClick = vi.fn();
    el.addEventListener('click', onClick);

    expect(action(el).hasAttribute('disabled')).toBe(true);
    expect(caret(el).hasAttribute('disabled')).toBe(true);

    el.show();
    await settle(el);

    expect(el.isOpen).toBe(false);
  });

  it('forwards the variant and the size to both segments', async () => {
    const el = await mount('variant="secondary" size="small"');

    for (const segment of [action(el), caret(el)]) {
      expect(segment.getAttribute('variant')).toBe('secondary');
      expect(segment.getAttribute('size')).toBe('small');
    }
  });

  it('hangs the panel off the right edge of the button', async () => {
    const el = await mount();

    expect(dropdown(el).align).toBe('end');
  });

  it('falls back to the item id when it carries no label', async () => {
    const el = await mount();
    el.items = [{ id: 'raw' }];
    await settle(el);

    expect(rows(el)[0]!.textContent!.trim()).toBe('raw');
  });
});
