/** The media under the words, or beside them when split and wide. */
import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import '../../../styles.css';
import './kt-hero.js';
import type { KtHero } from 'kanto-ds';

async function mount(width: number, layout: string) {
  const el = await fixture<KtHero>(
    `<kt-hero heading="Invoices that pay themselves" layout="${layout}" style="width: ${width}px">
      <div slot="media" style="height: 200px; background: gray">media</div>
    </kt-hero>`,
  );
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return el;
}

const box = (el: KtHero, selector: string) =>
  el.shadowRoot!.querySelector(selector)!.getBoundingClientRect();

describe('kt-hero, laid out', () => {
  it('puts the media under the words when stacked', async () => {
    const el = await mount(1100, 'stacked');
    expect(box(el, '.media').top).toBeGreaterThanOrEqual(box(el, '.words').bottom);
  });

  it('sets the media beside the words when split and wide, under them when narrow', async () => {
    const wide = await mount(1100, 'split');
    expect(box(wide, '.media').left).toBeGreaterThanOrEqual(box(wide, '.words').right);
    const narrow = await mount(600, 'split');
    expect(box(narrow, '.media').top).toBeGreaterThanOrEqual(box(narrow, '.words').bottom);
  });
});
