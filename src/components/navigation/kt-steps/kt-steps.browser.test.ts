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

async function mount(orientation = 'horizontal', navigable = false): Promise<KtSteps> {
  const el = await fixture<KtSteps>(
    `<kt-steps current="team" orientation="${orientation}" ${navigable ? 'navigable' : ''} style="width: 900px"></kt-steps>`,
  );
  el.steps = STEPS;
  await settle(el);
  // Drawn once, as a page is before anyone acts on it: a transition needs a
  // style to start from.
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return el;
}

const box = (node: Element) => node.getBoundingClientRect();
const middleY = (rect: DOMRect) => rect.top + rect.height / 2;
const middleX = (rect: DOMRect) => rect.left + rect.width / 2;
const all = (el: KtSteps, selector: string) => [...el.shadowRoot!.querySelectorAll(selector)];
/** One connector between each two steps — never none, or the checks pass empty. */
function connectors(el: KtSteps): Element[] {
  const found = all(el, '.connector');
  expect(found).toHaveLength(STEPS.length - 1);
  return found;
}

describe('kt-steps across', () => {
  for (const navigable of [false, true]) {
    describe(navigable ? 'navigable' : 'read-only', () => {
      it('puts each label under its marker, centred on it', async () => {
        const el = await mount('horizontal', navigable);
        const markers = all(el, '.marker');
        all(el, '.label').forEach((label, index) => {
          const marker = box(markers[index]!);
          expect(Math.abs(middleX(box(label)) - middleX(marker))).toBeLessThanOrEqual(1);
          expect(box(label).top).toBeGreaterThanOrEqual(marker.bottom);
        });
      });

      it('runs each connector from marker to marker, through their middle, clear of both', async () => {
        const el = await mount('horizontal', navigable);
        const markers = all(el, '.marker');
        connectors(el).forEach((connector, index) => {
          const line = box(connector);
          const from = box(markers[index]!);
          const to = box(markers[index + 1]!);
          expect(Math.abs(middleY(line) - middleY(from))).toBeLessThanOrEqual(1);
          const before = line.left - from.right;
          const after = to.left - line.right;
          expect(before).toBeGreaterThanOrEqual(6);
          expect(Math.abs(before - after)).toBeLessThanOrEqual(1);
        });
      });
    });
  }

  it('gives every step the same width', async () => {
    const el = await mount();
    const widths = all(el, 'li').map((li) => Math.round(box(li).width));
    expect(new Set(widths).size).toBe(1);
  });
});

describe('kt-steps markers', () => {
  it('are filled circles', async () => {
    const el = await mount();
    for (const marker of all(el, '.marker')) {
      const style = getComputedStyle(marker);
      expect(style.borderTopLeftRadius).toBe('50%');
      expect(style.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(box(marker).width).toBe(box(marker).height);
    }
  });

  it('centre the tick on the marker, by its ink', async () => {
    const el = await mount();
    const done = all(el, '.marker')[0]!;
    // The ink, not the icon's box: Lucide's tick sits high in its square.
    const tick = done.querySelector('kt-icon')!.shadowRoot!.querySelector('path')!;
    expect(Math.abs(middleY(box(tick)) - middleY(box(done)))).toBeLessThanOrEqual(0.25);
    expect(Math.abs(middleX(box(tick)) - middleX(box(done)))).toBeLessThanOrEqual(0.5);
  });

  it('centre the number on the marker, by its cap height', async () => {
    const el = await mount();
    for (const marker of all(el, '.marker').slice(2)) {
      const number = marker.querySelector('.number')!;
      expect(Math.abs(middleY(box(number)) - middleY(box(marker)))).toBeLessThanOrEqual(0.5);
      expect(Math.abs(middleX(box(number)) - middleX(box(marker)))).toBeLessThanOrEqual(0.5);
      // Trimmed to the digits, not the line: smaller than the font size.
      expect(box(number).height).toBeLessThan(parseFloat(getComputedStyle(number).fontSize));
    }
  });
});

describe('kt-steps down', () => {
  it('centres each label on its marker, beside it', async () => {
    const el = await mount('vertical');
    const markers = all(el, '.marker');
    all(el, '.label').forEach((label, index) => {
      const marker = box(markers[index]!);
      expect(Math.abs(middleY(box(label)) - middleY(marker))).toBeLessThanOrEqual(1);
      expect(box(label).left).toBeGreaterThan(marker.right);
    });
  });

  it('draws the connector down the marker middle, clear of both markers', async () => {
    const el = await mount('vertical');
    const markers = all(el, '.marker');
    connectors(el).forEach((connector, index) => {
      const line = box(connector);
      const above = box(markers[index]!);
      const below = box(markers[index + 1]!);
      expect(Math.abs(middleX(line) - middleX(above))).toBeLessThanOrEqual(1);
      expect(line.top - above.bottom).toBeGreaterThanOrEqual(6);
      expect(below.top - line.bottom).toBeGreaterThanOrEqual(6);
      expect(line.height).toBeGreaterThan(4);
    });
  });
});

describe('kt-steps motion', () => {
  /** What is moving inside it — transitions and animations, its own only. */
  const moving = (el: KtSteps) =>
    el.shadowRoot!.getAnimations().filter((animation) => {
      const target = (animation.effect as KeyframeEffect).target as Element | null;
      return (
        target?.closest('li') &&
        !(animation instanceof CSSTransition && animation.transitionProperty.includes('color'))
      );
    });

  it('stays still when it first appears', async () => {
    const el = await mount();
    expect(moving(el)).toHaveLength(0);
  });

  it('fills the connector to the next step, and draws the tick in', async () => {
    const el = await mount();
    el.current = 'done';
    await settle(el);
    const fill = all(el, '.connector .fill')[2]!;
    const fills = fill.getAnimations();
    expect(
      fills.some((a) => a instanceof CSSTransition && a.transitionProperty === 'transform'),
    ).toBe(true);
    const tick = all(el, '.marker')[2]!.querySelector('kt-icon')!;
    expect(
      tick
        .getAnimations()
        .some((a) => a instanceof CSSAnimation && a.animationName === 'kt-steps-tick'),
    ).toBe(true);
  });

  it('empties it again, going back', async () => {
    const el = await mount();
    el.current = 'billing';
    await settle(el);
    const fill = all(el, '.connector .fill')[1]!;
    expect(fill.getAnimations().some((a) => a instanceof CSSTransition)).toBe(true);
  });

  it('a filled connector is the full width of its track', async () => {
    const el = await mount();
    const [done, , ahead] = all(el, '.connector');
    expect(box(done!.querySelector('.fill')!).width).toBeCloseTo(box(done!).width, 0);
    expect(box(ahead!.querySelector('.fill')!).width).toBe(0);
  });
});
