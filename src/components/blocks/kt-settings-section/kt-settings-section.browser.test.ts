/** The heading beside the fields when split and wide, over them otherwise. */
import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import '../../../styles.css';
import './kt-settings-section.js';
import type { KtSettingsSection } from 'kanto-ds';

async function mount(width: number, layout: string) {
  const el = await fixture<KtSettingsSection>(
    `<kt-settings-section heading="Profile" description="How others see you." layout="${layout}" style="width: ${width}px">
      <input aria-label="Name" />
    </kt-settings-section>`,
  );
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const box = (selector: string) => el.shadowRoot!.querySelector(selector)!.getBoundingClientRect();
  return { about: box('.about'), card: box('.card') };
}

describe('kt-settings-section, laid out', () => {
  it('sets the heading beside the fields when split and wide', async () => {
    const { about, card } = await mount(1000, 'split');
    expect(card.left).toBeGreaterThanOrEqual(about.right);
  });

  it('puts the heading over the fields when narrow, or stacked', async () => {
    const narrow = await mount(500, 'split');
    expect(narrow.card.top).toBeGreaterThanOrEqual(narrow.about.bottom);
    const stacked = await mount(1000, 'stacked');
    expect(stacked.card.top).toBeGreaterThanOrEqual(stacked.about.bottom);
  });
});
