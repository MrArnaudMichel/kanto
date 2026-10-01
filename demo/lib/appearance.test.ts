import { render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KT_DEFAULT_APPEARANCE } from 'kanto-ds';
import { applyDocsAppearance, customiseMenu, readDocsAppearance } from './appearance.js';

const KEY = 'kanto-docs-appearance';

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
  const root = document.documentElement;
  for (const name of ['theme', 'accent', 'font', 'radius', 'density', 'textSize']) {
    delete root.dataset[name];
  }
  root.removeAttribute('style');
  document.body.replaceChildren();
});

describe('the stored appearance', () => {
  it('is the default when nothing is stored', () => {
    expect(readDocsAppearance()).toEqual(KT_DEFAULT_APPEARANCE);
  });

  it('keeps what is valid and drops what is not', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ theme: 'light', font: 'comic', density: 'compact', accent: 'oklch(.)' }),
    );
    expect(readDocsAppearance()).toEqual({
      ...KT_DEFAULT_APPEARANCE,
      theme: 'light',
      density: 'compact',
    });
    localStorage.setItem(KEY, '{nope');
    expect(readDocsAppearance()).toEqual(KT_DEFAULT_APPEARANCE);
  });

  it('migrates the theme and accent kept under the old keys', () => {
    localStorage.setItem('kanto-docs-theme', 'light');
    localStorage.setItem('kanto-docs-accent', JSON.stringify({ kind: 'custom', color: '#16a34a' }));
    expect(readDocsAppearance()).toMatchObject({ theme: 'light', accent: '#16a34a' });
    localStorage.setItem('kanto-docs-accent', JSON.stringify({ kind: 'preset', id: 'teal' }));
    expect(readDocsAppearance().accent).toBe('teal');
  });

  it('is the default when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(readDocsAppearance()).toEqual(KT_DEFAULT_APPEARANCE);
  });

  it('applies to the page and is kept, even when storage is blocked', () => {
    applyDocsAppearance({ ...KT_DEFAULT_APPEARANCE, density: 'compact', accent: 'green' });
    expect(document.documentElement.dataset['density']).toBe('compact');
    expect(document.documentElement.dataset['accent']).toBe('green');
    expect(readDocsAppearance().density).toBe('compact');

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => applyDocsAppearance({ ...KT_DEFAULT_APPEARANCE, radius: 'round' })).not.toThrow();
    expect(document.documentElement.dataset['radius']).toBe('round');
  });
});

describe('the Customise menu', () => {
  function mount(current = KT_DEFAULT_APPEARANCE) {
    const onChange = vi.fn();
    const host = document.body.appendChild(document.createElement('div'));
    render(customiseMenu(current, onChange), host);
    return { host, onChange };
  }

  it('opens from a sliders icon button named Customise', () => {
    const trigger = mount().host.querySelector('kt-dropdown > kt-button[slot="trigger"]')!;
    expect(trigger.getAttribute('icon')).toBe('sliders-horizontal');
    expect(trigger.getAttribute('label')).toBe('Customise');
  });

  it('shows its label beside the icon', () => {
    const trigger = mount().host.querySelector('kt-dropdown > kt-button[slot="trigger"]')!;
    expect(trigger.textContent).toContain('Customise');
  });

  it('says when it opens', () => {
    const onOpen = vi.fn();
    const host = document.body.appendChild(document.createElement('div'));
    render(customiseMenu(KT_DEFAULT_APPEARANCE, vi.fn(), onOpen), host);
    host.querySelector('kt-dropdown')!.dispatchEvent(new CustomEvent('kt-open'));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('has a section for each setting', () => {
    const headings = [...mount().host.querySelectorAll('.customise-heading')].map((h) =>
      h.textContent!.trim(),
    );
    expect(headings).toEqual(['Theme', 'Accent', 'Font', 'Corners', 'Density', 'Text size']);
  });

  it('changes one setting and keeps the rest', () => {
    const { host, onChange } = mount({ ...KT_DEFAULT_APPEARANCE, density: 'compact' });
    host.querySelector<HTMLElement>('[data-accent-id="blue"]')!.click();
    expect(onChange).toHaveBeenLastCalledWith({
      ...KT_DEFAULT_APPEARANCE,
      density: 'compact',
      accent: 'blue',
    });
    host.querySelector<HTMLElement>('[data-font-id="inter"]')!.click();
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ font: 'inter' }));
  });

  it('takes a segmented choice', () => {
    const { host, onChange } = mount();
    const density = host.querySelector('kt-segmented-control[label="Density"]')!;
    density.dispatchEvent(
      new CustomEvent('kt-change', { detail: { value: 'comfortable' }, bubbles: true }),
    );
    expect(onChange).toHaveBeenLastCalledWith({ ...KT_DEFAULT_APPEARANCE, density: 'comfortable' });
  });

  it('shows each font in its own face, the current one checked', () => {
    const fonts = [
      ...mount({ ...KT_DEFAULT_APPEARANCE, font: 'plex' }).host.querySelectorAll<HTMLElement>(
        '[data-font-id]',
      ),
    ];
    expect(fonts.map((f) => f.style.fontFamily)).toEqual(
      expect.arrayContaining([expect.stringContaining('IBM Plex Sans')]),
    );
    expect(fonts.find((f) => f.getAttribute('aria-checked') === 'true')!.dataset['fontId']).toBe(
      'plex',
    );
  });

  it('resets everything to Kanto', () => {
    const { host, onChange } = mount({ ...KT_DEFAULT_APPEARANCE, font: 'geist', radius: 'round' });
    host.querySelector<HTMLElement>('.customise-reset')!.click();
    expect(onChange).toHaveBeenLastCalledWith(KT_DEFAULT_APPEARANCE);
  });

  it('keeps the accent chooser: arrows, custom colour', () => {
    const { host, onChange } = mount();
    const radios = [...host.querySelectorAll<HTMLElement>('[data-accent-id]')];
    radios[0]!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ accent: 'blue' }));
    const input = host.querySelector<HTMLInputElement>('input[type="color"]')!;
    input.value = '#16a34a';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ accent: '#16a34a' }));
  });
});
