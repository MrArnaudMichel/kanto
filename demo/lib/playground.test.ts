import { render } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { KT_DEFAULT_APPEARANCE } from 'kanto-ds';
import { settle } from '#test/fixture';
import { playground, resetPlayground } from './playground.js';

function mount(onUse = vi.fn()) {
  const host = document.body.appendChild(document.createElement('div'));
  const draw = () =>
    render(playground({ start: KT_DEFAULT_APPEARANCE, onUse, rerender: draw }), host);
  draw();
  return { host, onUse, frame: () => host.querySelector<HTMLElement>('.playground-frame')! };
}

afterEach(() => {
  resetPlayground();
  document.body.replaceChildren();
  document.documentElement.removeAttribute('data-theme');
  vi.restoreAllMocks();
});

describe('the playground', () => {
  it('themes its frame and leaves the page alone', () => {
    const { host, frame } = mount();
    host.querySelector<HTMLElement>('[data-accent-id="teal"]')!.click();
    host.querySelector<HTMLElement>('[data-font-id="inter"]')!.click();
    expect(frame().dataset['accent']).toBe('teal');
    expect(frame().dataset['font']).toBe('inter');
    expect(document.documentElement.hasAttribute('data-accent')).toBe(false);
    expect(document.documentElement.hasAttribute('data-font')).toBe(false);
  });

  it('shows the code for what was chosen', () => {
    const { host } = mount();
    host.querySelector<HTMLElement>('[data-accent-id="teal"]')!.click();
    expect(host.querySelector('.playground-code')!.textContent).toContain('data-accent="teal"');
  });

  it('copies the snippet of the tab in view', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const { host } = mount();
    host.querySelector<HTMLElement>('[data-accent-id="green"]')!.click();
    host
      .querySelector('kt-tabs')!
      .dispatchEvent(new CustomEvent('kt-change', { detail: { value: 'js' }, bubbles: true }));
    host.querySelector<HTMLElement>('.playground-copy')!.click();
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("accent: 'green'"));
    vi.unstubAllGlobals();
  });

  it('hands its appearance to the site on "Use on this site"', () => {
    const { host, onUse } = mount();
    host.querySelector<HTMLElement>('[data-accent-id="pink"]')!.click();
    host.querySelector<HTMLElement>('.playground-use')!.click();
    expect(onUse).toHaveBeenCalledWith(expect.objectContaining({ accent: 'pink' }));
  });

  it('previews light inside a dark site', () => {
    const { host, frame } = mount();
    host
      .querySelector('kt-segmented-control[label="Theme"]')!
      .dispatchEvent(new CustomEvent('kt-change', { detail: { value: 'light' }, bubbles: true }));
    expect(frame().dataset['theme']).toBe('light');
  });

  it('explains the frame theme on a light site, rather than failing quietly', async () => {
    document.documentElement.dataset['theme'] = 'light';
    const { host } = mount();
    const theme = host.querySelector('kt-segmented-control[label="Theme"]')!;
    await settle(theme);
    expect(theme.hasAttribute('disabled')).toBe(true);
    expect(host.querySelector('.playground-theme-note')!.textContent).toMatch(/dark/i);
  });

  it('hands over and writes out the light it shows on a light site', () => {
    document.documentElement.dataset['theme'] = 'light';
    const { host, onUse } = mount();
    host.querySelector<HTMLElement>('[data-accent-id="teal"]')!.click();
    expect(host.querySelector('.playground-code')!.textContent).toContain('data-theme="light"');
    host.querySelector<HTMLElement>('.playground-use')!.click();
    expect(onUse).toHaveBeenCalledWith(expect.objectContaining({ theme: 'light', accent: 'teal' }));
  });
});
