/** The number field with a real keyboard, beside a kt-input. */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-number-input.js';
import '../kt-input/kt-input.js';
import type { KtNumberInput } from 'kanto-ds';

describe('kt-number-input, for real', () => {
  it('takes a typed number, reads it on Enter and steps it on the arrows', async () => {
    const el = await fixture<KtNumberInput>(
      '<kt-number-input label="Seats" min="1" max="50" locale="en-US"></kt-number-input>',
    );
    await userEvent.click(el.shadowRoot!.querySelector('input')!);
    await userEvent.keyboard('12{Enter}{ArrowUp}{ArrowUp}');
    await settle(el);
    expect(el.value).toBe(14);
  });

  it('is as tall as a kt-input beside it', async () => {
    const row = await fixture<HTMLDivElement>(
      '<div><kt-number-input label="Seats"></kt-number-input><kt-input label="Name"></kt-input></div>',
    );
    const height = (selector: string) =>
      row.querySelector(selector)!.shadowRoot!.querySelector('.field')!.getBoundingClientRect()
        .height;
    expect(height('kt-number-input')).toBe(height('kt-input'));
  });
});

describe('kt-number-input motion', () => {
  const roll = (el: KtNumberInput) =>
    el
      .shadowRoot!.querySelector('input')!
      .getAnimations()
      .filter((a) => a.id === 'kt-number-roll');
  /** Where the new number starts: below for up, above for down. */
  const from = (animation: Animation) =>
    parseFloat(
      String((animation.effect as KeyframeEffect).getKeyframes()[0]!.translate).split(' ')[1] ??
        '0',
    );

  async function mount(): Promise<KtNumberInput> {
    const el = await fixture<KtNumberInput>(
      '<kt-number-input label="Seats" min="1" max="50" value="10" locale="en-US"></kt-number-input>',
    );
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return el;
  }

  it('is still when it first appears', async () => {
    expect(roll(await mount())).toHaveLength(0);
  });

  it('rolls the number up as it grows, and down as it shrinks', async () => {
    const el = await mount();
    await userEvent.click(el.shadowRoot!.querySelector<HTMLElement>('.plus')!);
    await settle(el);
    const [up] = roll(el);
    expect(up).toBeDefined();
    expect(from(up!)).toBeGreaterThan(0);

    await userEvent.click(el.shadowRoot!.querySelector<HTMLElement>('.minus')!);
    await settle(el);
    const [down] = roll(el);
    expect(from(down!)).toBeLessThan(0);
  });

  it('rolls on the arrow keys too, but not on what is typed', async () => {
    const el = await mount();
    const input = el.shadowRoot!.querySelector('input')!;
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowUp}');
    await settle(el);
    expect(roll(el)).toHaveLength(1);
    await roll(el)[0]!.finished;

    await userEvent.keyboard('{Control>}a{/Control}25{Enter}');
    await settle(el);
    expect(el.value).toBe(25);
    expect(roll(el)).toHaveLength(0);
  });

  it('does not roll at a bound, where nothing changed', async () => {
    const el = await fixture<KtNumberInput>(
      '<kt-number-input label="Seats" min="1" max="10" value="10"></kt-number-input>',
    );
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const input = el.shadowRoot!.querySelector('input')!;
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowUp}');
    await settle(el);
    expect(roll(el)).toHaveLength(0);
  });
});
