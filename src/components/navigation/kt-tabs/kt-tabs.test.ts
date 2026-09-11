import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fixture, settle } from '#test/fixture';
import './kt-tabs.js';
import type { KtTab, KtTabs } from 'kanto-ds';

const TABS: KtTab[] = [
  { value: 'usage', label: 'Usage' },
  { value: 'theme', label: 'Theme', disabled: true },
  { value: 'api', label: 'API', icon: 'code', panel: 'api-panel' },
];

const list = (el: KtTabs) => el.shadowRoot!.querySelector('.tablist')!;
const tabs = (el: KtTabs) => [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('.tab')];
const key = (el: KtTabs, k: string) =>
  list(el).dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

describe('kt-tabs', () => {
  let el: KtTabs;

  beforeEach(async () => {
    el = await fixture<KtTabs>('<kt-tabs label="Sections"></kt-tabs>');
    el.tabs = TABS;
    el.value = 'usage';
    await settle(el);
  });

  it('is a tablist of tabs', () => {
    expect(list(el).getAttribute('role')).toBe('tablist');
    expect(list(el).getAttribute('aria-label')).toBe('Sections');
    expect(tabs(el).map((t) => t.getAttribute('role'))).toEqual(['tab', 'tab', 'tab']);
    expect(tabs(el).map((t) => t.getAttribute('aria-selected'))).toEqual([
      'true',
      'false',
      'false',
    ]);
  });

  it('keeps a single tab stop, on the selected tab', () => {
    expect(tabs(el).map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
  });

  it('points a tab at the region it controls', () => {
    expect(tabs(el)[2]!.getAttribute('aria-controls')).toBe('api-panel');
    expect(tabs(el)[0]!.hasAttribute('aria-controls')).toBe(false);
  });

  it('selects on click and reports it', async () => {
    const listener = vi.fn();
    el.addEventListener('kt-change', listener);

    tabs(el)[2]!.click();
    await settle(el);

    expect(el.value).toBe('api');
    expect(listener.mock.calls[0]![0].detail.value).toBe('api');
    expect(listener.mock.calls[0]![0].detail.tab.label).toBe('API');
  });

  it('ignores a disabled tab', async () => {
    tabs(el)[1]!.click();
    await settle(el);
    expect(el.value).toBe('usage');
    expect(tabs(el)[1]!.disabled).toBe(true);
  });

  it('says nothing when the active tab is clicked again', async () => {
    const listener = vi.fn();
    el.addEventListener('kt-change', listener);

    tabs(el)[0]!.click();
    await settle(el);

    expect(listener).not.toHaveBeenCalled();
  });

  it('walks with the arrows, skipping disabled tabs and wrapping', async () => {
    key(el, 'ArrowRight');
    await settle(el);
    expect(el.value).toBe('api');

    key(el, 'ArrowRight');
    await settle(el);
    expect(el.value).toBe('usage');

    key(el, 'ArrowLeft');
    await settle(el);
    expect(el.value).toBe('api');
  });

  it('jumps to the ends with Home and End', async () => {
    key(el, 'End');
    await settle(el);
    expect(el.value).toBe('api');

    key(el, 'Home');
    await settle(el);
    expect(el.value).toBe('usage');
  });

  it('renders placeholders while loading, and no tabs', async () => {
    el.loading = true;
    await settle(el);

    expect(tabs(el)).toHaveLength(0);
    expect(el.shadowRoot!.querySelectorAll('kt-skeleton')).toHaveLength(3);
    expect(el.shadowRoot!.querySelector('.loading')!.getAttribute('aria-hidden')).toBe('true');
  });

  it('disables every tab at once', async () => {
    el.disabled = true;
    await settle(el);
    expect(tabs(el).every((t) => t.disabled)).toBe(true);
  });

  it('falls back to the value when a tab has no label', async () => {
    el.tabs = [{ value: 42 }];
    await settle(el);
    expect(tabs(el)[0]!.textContent!.trim()).toBe('42');
  });
});
