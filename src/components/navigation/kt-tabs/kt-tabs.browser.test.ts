/**
 * The selected tab's underline: one bar that slides between tabs, placed
 * from their laid-out boxes.
 */
import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-tabs.js';
import type { KtTabs } from 'kanto-ds';

const TABS = [
  { value: 'usage', label: 'Usage' },
  { value: 'api', label: 'API reference' },
  { value: 'theme', label: 'Theme' },
];
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function mount(value: string | null = 'usage'): Promise<KtTabs> {
  const el = await fixture<KtTabs>('<kt-tabs label="Sections"></kt-tabs>');
  el.tabs = TABS;
  el.value = value;
  await settle(el);
  await frame();
  return el;
}

const indicator = (el: KtTabs) => el.shadowRoot!.querySelector<HTMLElement>('.indicator')!;
const tab = (el: KtTabs, index: number) => el.shadowRoot!.querySelectorAll('.tab')[index]!;
const sliding = (el: KtTabs) =>
  indicator(el)
    .getAnimations()
    .filter((a) => a instanceof CSSTransition);

function expectUnder(el: KtTabs, index: number): void {
  const bar = indicator(el).getBoundingClientRect();
  const under = tab(el, index).getBoundingClientRect();
  expect(Math.abs(bar.left - under.left)).toBeLessThanOrEqual(1);
  expect(Math.abs(bar.width - under.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(bar.bottom - under.bottom)).toBeLessThanOrEqual(1);
  expect(bar.height).toBe(2);
}

describe('kt-tabs indicator', () => {
  it('sits under the selected tab, still, when it first appears', async () => {
    const el = await mount();
    expectUnder(el, 0);
    expect(sliding(el)).toHaveLength(0);
  });

  it('slides to the tab chosen next', async () => {
    const el = await mount();
    el.value = 'api';
    await settle(el);
    await frame();
    expect(sliding(el).length).toBeGreaterThan(0);
    await wait(400);
    expectUnder(el, 1);
  });

  it('is the only underline: the tab draws none of its own', async () => {
    const el = await mount();
    expect(getComputedStyle(tab(el, 0)).borderBottomColor).toBe('rgba(0, 0, 0, 0)');
  });

  it('is hidden when no tab is selected', async () => {
    const el = await mount(null);
    expect(getComputedStyle(indicator(el)).display).toBe('none');
  });
});
