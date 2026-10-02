/**
 * The steps' geometry: what lines up with what only shows once laid out.
 */
import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-steps.js';
import type { KtSteps } from 'kanto-ds';

const STEPS = [
  { id: 'account', label: 'Account' },
  { id: 'billing', label: 'Billing', description: 'Card or invoice' },
  { id: 'team', label: 'Team' },
  { id: 'done', label: 'Done' },
];

async function mount(orientation = 'horizontal'): Promise<KtSteps> {
  const el = await fixture<KtSteps>(
    `<kt-steps current="team" orientation="${orientation}" style="width: 900px"></kt-steps>`,
  );
  el.steps = STEPS;
  await settle(el);
  return el;
}

const box = (node: Element) => node.getBoundingClientRect();
const middle = (rect: DOMRect) => rect.top + rect.height / 2;
const all = (el: KtSteps, selector: string) => [...el.shadowRoot!.querySelectorAll(selector)];
/** One connector between each two steps — never none, or the checks pass empty. */
function connectors(el: KtSteps): Element[] {
  const found = all(el, '.connector');
  expect(found).toHaveLength(STEPS.length - 1);
  return found;
}

describe('kt-steps layout', () => {
  it('runs each connector through the middle of the markers, description or not', async () => {
    const el = await mount();
    const marker = middle(box(all(el, '.marker')[0]!));
    for (const connector of connectors(el)) {
      expect(Math.abs(middle(box(connector)) - marker)).toBeLessThanOrEqual(1);
    }
  });

  it('centres each label on its marker', async () => {
    const el = await mount();
    const markers = all(el, '.marker');
    all(el, '.label').forEach((label, index) => {
      expect(Math.abs(middle(box(label)) - middle(box(markers[index]!)))).toBeLessThanOrEqual(1);
    });
  });

  it('ends on the last step, with no gap after it', async () => {
    const el = await mount();
    const last = box(all(el, 'li').at(-1)!);
    expect(Math.abs(last.right - box(el).right)).toBeLessThanOrEqual(1);
    const label = box(all(el, '.label').at(-1)!);
    expect(Math.abs(label.right - last.right)).toBeLessThanOrEqual(1);
  });

  it('spaces the connectors evenly between the steps', async () => {
    const el = await mount();
    const steps = all(el, 'li');
    connectors(el).forEach((connector, index) => {
      const before = box(connector).left - box(steps[index]!.querySelector('.text')!).right;
      const after = box(steps[index + 1]!.querySelector('.marker')!).left - box(connector).right;
      expect(Math.abs(before - after)).toBeLessThanOrEqual(1);
    });
  });

  it('draws the vertical connector down the marker middle, clear of both markers', async () => {
    const el = await mount('vertical');
    const markers = all(el, '.marker');
    connectors(el).forEach((connector, index) => {
      const line = box(connector);
      const above = box(markers[index]!);
      const below = box(markers[index + 1]!);
      expect(
        Math.abs(line.left + line.width / 2 - (above.left + above.width / 2)),
      ).toBeLessThanOrEqual(1);
      expect(line.top - above.bottom).toBeGreaterThanOrEqual(6);
      expect(below.top - line.bottom).toBeGreaterThanOrEqual(6);
      expect(line.height).toBeGreaterThan(4);
    });
  });
});
