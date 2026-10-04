/** The actions under the words, or beside them when inline and wide. */
import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import '../../../styles.css';
import './kt-cta.js';
import type { KtCta } from 'kanto-ds';

async function mount(width: number, layout: string) {
  const el = await fixture<KtCta>(
    `<kt-cta heading="Start sending invoices" layout="${layout}" style="width: ${width}px">
      <button slot="actions">Start free</button>
    </kt-cta>`,
  );
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const box = (selector: string) => el.shadowRoot!.querySelector(selector)!.getBoundingClientRect();
  return { words: box('.block-head'), actions: box('.actions') };
}

describe('kt-cta, laid out', () => {
  it('puts the actions under the words when stacked', async () => {
    const { words, actions } = await mount(1000, 'stacked');
    expect(actions.top).toBeGreaterThanOrEqual(words.bottom);
  });

  it('sets the actions beside the words when inline and wide, under them when narrow', async () => {
    const wide = await mount(1000, 'inline');
    expect(wide.actions.left).toBeGreaterThanOrEqual(wide.words.right);
    const narrow = await mount(420, 'inline');
    expect(narrow.actions.top).toBeGreaterThanOrEqual(narrow.words.bottom);
  });
});
