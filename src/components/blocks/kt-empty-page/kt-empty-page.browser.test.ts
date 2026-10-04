/** A step's action at the end of its row when wide, under its words when narrow. */
import { describe, expect, it } from 'vitest';
import { fixture } from '#test/fixture';
import '../../../styles.css';
import './kt-empty-page.js';
import type { KtEmptyPage } from 'kanto-ds';

async function mount(width: number) {
  const el = await fixture<KtEmptyPage>(
    `<kt-empty-page heading="Welcome" style="width: ${width}px"></kt-empty-page>`,
  );
  el.steps = [
    {
      id: 'customer',
      title: 'Add a customer',
      description: 'Who you bill.',
      action: 'Add customer',
    },
  ];
  await el.updateComplete;
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const box = (selector: string) => el.shadowRoot!.querySelector(selector)!.getBoundingClientRect();
  return { text: box('.step-text'), act: box('.act') };
}

describe('kt-empty-page, laid out', () => {
  it('puts the action at the end of the row when wide', async () => {
    const { text, act } = await mount(900);
    expect(act.left).toBeGreaterThanOrEqual(text.right);
  });

  it('puts the action under the words when narrow', async () => {
    const { text, act } = await mount(380);
    expect(act.top).toBeGreaterThanOrEqual(text.bottom);
  });
});
