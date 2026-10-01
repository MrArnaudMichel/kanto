import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'lit';
import { accentChooser, accentMenu, applyAccent, readAccent } from './accent.js';

const KEY = 'kanto-docs-accent';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  document.documentElement.removeAttribute('data-accent');
  document.documentElement.removeAttribute('style');
  document.body.replaceChildren();
});

describe('the docs accent', () => {
  it('is violet when nothing is stored', () => {
    expect(readAccent()).toEqual({ kind: 'preset', id: 'violet' });
  });

  it('is violet when what is stored is not an accent', () => {
    localStorage.setItem(KEY, '{nope');
    expect(readAccent()).toEqual({ kind: 'preset', id: 'violet' });
    localStorage.setItem(KEY, JSON.stringify({ kind: 'custom', color: 'blue' }));
    expect(readAccent()).toEqual({ kind: 'preset', id: 'violet' });
    localStorage.setItem(KEY, JSON.stringify({ kind: 'preset', id: 'mauve' }));
    expect(readAccent()).toEqual({ kind: 'preset', id: 'violet' });
  });

  it('is violet when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readAccent()).toEqual({ kind: 'preset', id: 'violet' });
  });

  it('applies a preset, then a custom colour, then a preset again', () => {
    const root = document.documentElement;
    applyAccent({ kind: 'preset', id: 'blue' });
    expect(root.dataset['accent']).toBe('blue');

    applyAccent({ kind: 'custom', color: '#16a34a' });
    expect(root.dataset['accent']).toBe('custom');
    expect(root.style.getPropertyValue('--accent-base')).not.toBe('');

    applyAccent({ kind: 'preset', id: 'teal' });
    expect(root.dataset['accent']).toBe('teal');
    expect(root.style.getPropertyValue('--accent-base')).toBe('');
    expect(readAccent()).toEqual({ kind: 'preset', id: 'teal' });
  });

  it('keeps working when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => applyAccent({ kind: 'preset', id: 'green' })).not.toThrow();
    expect(document.documentElement.dataset['accent']).toBe('green');
  });
});

describe('the chooser', () => {
  function mount(current = readAccent()) {
    const onPick = vi.fn();
    // A fresh container each time: Lit keeps its render state on the node.
    const host = document.body.appendChild(document.createElement('div'));
    render(accentChooser(current, onPick), host);
    const radios = [...host.querySelectorAll<HTMLElement>('[role="radio"]')];
    return { onPick, radios };
  }

  it('offers every preset as a named radio, the current one checked', () => {
    const { radios } = mount({ kind: 'preset', id: 'green' });
    expect(radios.map((r) => r.getAttribute('aria-label'))).toEqual([
      'Violet',
      'Blue',
      'Teal',
      'Green',
      'Orange',
      'Pink',
      'Slate',
    ]);
    expect(radios.filter((r) => r.getAttribute('aria-checked') === 'true')).toHaveLength(1);
    expect(radios[3]!.getAttribute('aria-checked')).toBe('true');
    expect(radios.map((r) => r.tabIndex)).toEqual([-1, -1, -1, 0, -1, -1, -1]);
  });

  it('picks a preset on click', () => {
    const { onPick, radios } = mount();
    radios[1]!.click();
    expect(onPick).toHaveBeenCalledWith({ kind: 'preset', id: 'blue' });
  });

  it('moves between presets with the arrows, picking as it goes', () => {
    const { onPick, radios } = mount({ kind: 'preset', id: 'violet' });
    radios[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(onPick).toHaveBeenLastCalledWith({ kind: 'preset', id: 'blue' });
    radios[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    expect(onPick).toHaveBeenLastCalledWith({ kind: 'preset', id: 'slate' });
  });

  it('takes a custom colour from the colour input', () => {
    const { onPick } = mount();
    const input = document.body.querySelector<HTMLInputElement>('input[type="color"]')!;
    input.value = '#16a34a';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(onPick).toHaveBeenCalledWith({ kind: 'custom', color: '#16a34a' });
  });

  it('shows the custom colour as checked when one is in use', () => {
    const { radios } = mount({ kind: 'custom', color: '#16a34a' });
    expect(radios.some((r) => r.getAttribute('aria-checked') === 'true')).toBe(false);
    expect(document.body.querySelector('.accent-custom')!.textContent).toContain('#16a34a');
  });
});

describe('the top-bar menu', () => {
  function mount(current = readAccent()) {
    const host = document.body.appendChild(document.createElement('div'));
    render(accentMenu(current, vi.fn()), host);
    return host;
  }

  it('opens from a palette icon button, named for what it does', () => {
    const trigger = mount().querySelector('kt-dropdown > kt-button[slot="trigger"]')!;
    expect(trigger.getAttribute('icon')).toBe('palette');
    expect(trigger.getAttribute('label')).toBe('Accent colour');
  });

  it('names the custom colour input', () => {
    const input = mount().querySelector<HTMLInputElement>('input[type="color"]')!;
    expect(input.closest('label')!.textContent).toContain('Custom colour');
  });

  it('shows the custom colour as the custom swatch when one is in use', () => {
    const host = mount({ kind: 'custom', color: '#16a34a' });
    const swatch = host.querySelector<HTMLElement>('.accent-custom-swatch')!;
    expect(swatch.style.getPropertyValue('--swatch')).toBe('#16a34a');
  });
});
