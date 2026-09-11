import { describe, expect, it, vi } from 'vitest';
import { fixture, settle } from 'kanto-ds/test/fixture';
import './kt-toggle-button.js';
import '../kt-toggle-button-group/kt-toggle-button-group.js';
import type { KtToggleButton } from 'kanto-ds';
import type { KtToggleButtonGroup } from 'kanto-ds';

const native = (el: KtToggleButton) => el.shadowRoot!.querySelector('button')!;

/**
 * Clicks the inner button the way a pointer does: composed, so the event
 * leaves the shadow root and reaches an enclosing group. HTMLElement.click()
 * is not composed in happy-dom, so it would stop at the boundary.
 */
const press = (el: KtToggleButton) =>
  native(el).dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

describe('kt-toggle-button', () => {
  it('reports its state through aria-pressed', async () => {
    const el = await fixture<KtToggleButton>('<kt-toggle-button>Bold</kt-toggle-button>');
    expect(native(el).getAttribute('aria-pressed')).toBe('false');

    native(el).click();
    await settle(el);

    expect(el.selected).toBe(true);
    expect(native(el).getAttribute('aria-pressed')).toBe('true');
  });

  it('reports the change with its value', async () => {
    const el = await fixture<KtToggleButton>(
      '<kt-toggle-button value="bold">Bold</kt-toggle-button>',
    );
    const listener = vi.fn();
    el.addEventListener('kt-change', listener);

    native(el).click();
    expect(listener.mock.calls[0]![0].detail).toEqual({ selected: true, value: 'bold' });
  });

  it('collapses to a square when it is icon-only', async () => {
    const el = await fixture<KtToggleButton>(
      '<kt-toggle-button icon="eye" label="Preview"></kt-toggle-button>',
    );
    expect(native(el).classList.contains('icon-only')).toBe(true);
    expect(native(el).getAttribute('aria-label')).toBe('Preview');
  });

  it('ignores clicks while disabled', async () => {
    const el = await fixture<KtToggleButton>('<kt-toggle-button disabled>Bold</kt-toggle-button>');
    native(el).click();
    await settle(el);
    expect(el.selected).toBe(false);
  });
});

describe('kt-toggle-button-group', () => {
  const markup = `
    <kt-toggle-button-group>
      <kt-toggle-button value="list">List</kt-toggle-button>
      <kt-toggle-button value="grid">Grid</kt-toggle-button>
      <kt-toggle-button value="map">Map</kt-toggle-button>
    </kt-toggle-button-group>`;

  const buttons = (group: KtToggleButtonGroup) => [
    ...group.querySelectorAll<KtToggleButton>('kt-toggle-button'),
  ];

  async function mount() {
    const group = await fixture<KtToggleButtonGroup>(markup);
    for (const button of buttons(group)) await settle(button);
    await settle(group);
    return group;
  }

  it('selects one at a time, and clears on a second press', async () => {
    const group = await mount();
    const listener = vi.fn();
    group.addEventListener('kt-change', listener);

    press(buttons(group)[0]!);
    await settle(group);
    expect(group.value).toBe('list');

    press(buttons(group)[1]!);
    await settle(group);
    expect(group.value).toBe('grid');
    expect(buttons(group)[0]!.selected).toBe(false);

    press(buttons(group)[1]!);
    await settle(group);
    expect(group.value).toBeNull();
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it('accumulates selections in multiple mode', async () => {
    const group = await mount();
    group.multiple = true;
    await settle(group);

    press(buttons(group)[0]!);
    await settle(group);
    press(buttons(group)[2]!);
    await settle(group);

    expect(group.value).toEqual(['list', 'map']);
    expect(buttons(group).map((b) => b.selected)).toEqual([true, false, true]);
  });

  it('drops a value from the set when its button is pressed again', async () => {
    const group = await mount();
    group.multiple = true;
    group.value = ['list', 'map'];
    await settle(group);

    press(buttons(group)[0]!);
    await settle(group);

    expect(group.value).toEqual(['map']);
  });

  it('reflects a value assigned from outside', async () => {
    const group = await mount();
    group.value = 'map';
    await settle(group);
    expect(buttons(group).map((b) => b.selected)).toEqual([false, false, true]);
  });

  it('keeps the buttons quiet so only the group reports', async () => {
    const group = await mount();
    const heard: unknown[] = [];
    group.addEventListener('kt-change', (e) => heard.push((e as CustomEvent).detail));

    press(buttons(group)[0]!);
    await settle(group);

    expect(heard).toEqual([{ value: 'list' }]);
  });
});
