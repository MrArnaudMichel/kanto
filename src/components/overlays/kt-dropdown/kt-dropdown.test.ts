import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-dropdown.js';
import type { KtDropdown } from 'kanto';
import type { KtOption } from 'kanto';

const OPTIONS: KtOption[] = [
  { id: 'edit', label: 'Edit' },
  { id: 'archive', label: 'Archive', disabled: true },
  { id: 'delete', label: 'Delete' },
];

const trigger = (el: KtDropdown) => el.shadowRoot!.querySelector<HTMLElement>('.trigger')!;
const panel = (el: KtDropdown) => el.shadowRoot!.querySelector('.panel')!;
const rows = (el: KtDropdown) => [...el.shadowRoot!.querySelectorAll<HTMLElement>('.option')];

describe('kt-dropdown', () => {
  let el: KtDropdown;

  beforeEach(async () => {
    el = await fixture<KtDropdown>(
      '<kt-dropdown><button slot="trigger">Actions</button></kt-dropdown>',
    );
    el.options = OPTIONS;
    await settle(el);
  });

  it('starts closed and opens on the trigger', async () => {
    expect(el.isOpen).toBe(false);
    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');

    trigger(el).click();
    await settle(el);

    expect(el.isOpen).toBe(true);
    expect(panel(el).classList.contains('open')).toBe(true);
    expect(trigger(el).getAttribute('aria-expanded')).toBe('true');
  });

  it('announces opening and closing', async () => {
    const opened = vi.fn();
    const closed = vi.fn();
    el.addEventListener('kt-open', opened);
    el.addEventListener('kt-close', closed);

    el.show();
    await settle(el);
    el.hide();
    await settle(el);

    expect(opened).toHaveBeenCalledOnce();
    expect(closed).toHaveBeenCalledOnce();
  });

  it('chooses a row and closes', async () => {
    const listener = vi.fn();
    el.addEventListener('kt-select', listener);

    el.show();
    await settle(el);
    rows(el)[0]!.click();
    await settle(el);

    expect(el.value).toBe('edit');
    expect(el.isOpen).toBe(false);
    expect(listener.mock.calls[0]![0].detail.value).toBe('edit');
  });

  it('ignores a disabled row', async () => {
    el.show();
    await settle(el);
    rows(el)[1]!.click();
    await settle(el);

    expect(el.value).toBeNull();
    expect(el.isOpen).toBe(true);
  });

  it('stays shut while disabled', async () => {
    el.disabled = true;
    await settle(el);

    trigger(el).click();
    await settle(el);

    expect(el.isOpen).toBe(false);
  });

  it('closes on Escape and on an outside press', async () => {
    el.show();
    await settle(el);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await settle(el);
    expect(el.isOpen).toBe(false);

    el.show();
    await settle(el);
    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    await settle(el);
    expect(el.isOpen).toBe(false);
  });

  it('flips above the trigger when there is no room below', async () => {
    const anchor = trigger(el);
    vi.spyOn(anchor, 'getBoundingClientRect').mockReturnValue({
      top: 700,
      bottom: 740,
      left: 0,
      right: 100,
      width: 100,
      height: 40,
      x: 0,
      y: 700,
      toJSON: () => ({}),
    });
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });

    el.show();
    await settle(el);

    expect(panel(el).classList.contains('top')).toBe(true);
  });

  it('falls back to a slot when there are no options', async () => {
    const custom = await fixture<KtDropdown>(
      '<kt-dropdown><button slot="trigger">Filtres</button><div slot="panel">Content</div></kt-dropdown>',
    );
    expect(custom.shadowRoot!.querySelector('slot[name="panel"]')).not.toBeNull();
    expect(custom.shadowRoot!.querySelector('.list')).toBeNull();
  });
});
