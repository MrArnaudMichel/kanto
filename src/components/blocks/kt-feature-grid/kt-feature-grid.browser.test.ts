/** As many columns as asked where there is room, one where there is not. */
import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import '../../../styles.css';
import './kt-feature-grid.js';
import type { KtFeatureGrid } from 'kanto-ds';

async function mount(width: number) {
  const el = await fixture<KtFeatureGrid>(
    `<kt-feature-grid heading="Why" style="width: ${width}px"></kt-feature-grid>`,
  );
  el.features = [1, 2, 3].map((n) => ({ title: `Feature ${n}`, description: 'Text.' }));
  await el.updateComplete;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return [...el.shadowRoot!.querySelectorAll('li')].map((li) => li.getBoundingClientRect());
}

describe('kt-feature-grid, laid out', () => {
  it('sets three features in a row when wide', async () => {
    const [a, b, c] = await mount(1100);
    expect(b!.top).toBe(a!.top);
    expect(c!.top).toBe(a!.top);
    expect(b!.left).toBeGreaterThan(a!.right);
  });

  it('stacks them when narrow', async () => {
    const [a, b] = await mount(360);
    expect(b!.top).toBeGreaterThanOrEqual(a!.bottom);
  });
});
