import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-dropdown.js';
import '../../core/kt-button/kt-button.js';
import type { KtDropdown } from 'kanto-ds';
import type { KtOption } from 'kanto-ds';

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
    const button = el.querySelector('button')!;
    expect(el.isOpen).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');

    trigger(el).click();
    await settle(el);

    expect(el.isOpen).toBe(true);
    expect(panel(el).classList.contains('open')).toBe(true);
    expect(button.getAttribute('aria-expanded')).toBe('true');
  });

  it('puts the popup state on the trigger itself, where focus is', async () => {
    // The wrapper around the slot is never focused, so state on it is never
    // announced — and aria-expanded is not allowed on a generic element.
    expect(trigger(el).hasAttribute('aria-expanded')).toBe(false);
    expect(el.querySelector('button')!.getAttribute('aria-haspopup')).toBe('menu');
  });

  it('drives a kt-button trigger through its properties', async () => {
    const dropdown = await fixture<KtDropdown>(
      '<kt-dropdown><kt-button slot="trigger" label="Actions"></kt-button></kt-dropdown>',
    );
    dropdown.options = OPTIONS;
    await settle(dropdown);
    const button = dropdown.querySelector('kt-button')!;
    expect(button.popup).toBe('menu');
    expect(button.expanded).toBe(false);

    dropdown.show();
    await settle(dropdown);
    expect(button.expanded).toBe(true);
  });

  it('is a plain disclosure around free content, not a menu', async () => {
    const dropdown = await fixture<KtDropdown>(
      '<kt-dropdown><button slot="trigger">Filters</button><div slot="panel">Content</div></kt-dropdown>',
    );
    const button = dropdown.querySelector('button')!;
    expect(button.hasAttribute('aria-haspopup')).toBe(false);
    expect(button.getAttribute('aria-expanded')).toBe('false');
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

describe('kt-dropdown alignment', () => {
  it('aligns the panel on the trigger start edge by default', async () => {
    const el = await fixture<KtDropdown>(
      '<kt-dropdown><button slot="trigger">Actions</button></kt-dropdown>',
    );

    expect(el.align).toBe('start');
    expect(panel(el).classList.contains('end')).toBe(false);
  });

  it('aligns the panel on the trigger end edge when asked', async () => {
    const el = await fixture<KtDropdown>(
      '<kt-dropdown align="end"><button slot="trigger">Actions</button></kt-dropdown>',
    );

    expect(el.align).toBe('end');
    expect(panel(el).classList.contains('end')).toBe(true);
  });
});
