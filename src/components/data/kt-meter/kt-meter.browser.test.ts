/**
 * A meter's new value: the fill moves to it, as a progress bar's does.
 */
import { describe, expect, it } from 'vitest';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-meter.js';
import type { KtMeter } from 'kanto-ds';

const widening = (el: KtMeter) =>
  [...el.shadowRoot!.querySelectorAll('.segment')].flatMap((segment) =>
    segment
      .getAnimations()
      .filter((a) => a instanceof CSSTransition && a.transitionProperty === 'width'),
  );

async function mount(markup: string): Promise<KtMeter> {
  const el = await fixture<KtMeter>(markup);
  await new Promise((resolve) => requestAnimationFrame(resolve));
  return el;
}

describe('kt-meter motion', () => {
  it('moves the fill to a new value', async () => {
    const el = await mount('<kt-meter label="Storage" value="20"></kt-meter>');
    expect(widening(el)).toHaveLength(0);
    el.value = 70;
    await settle(el);
    expect(widening(el)).toHaveLength(1);
  });

  it('moves every segment to its new share', async () => {
    const el = await mount('<kt-meter label="Storage"></kt-meter>');
    el.segments = [
      { label: 'Photos', value: 30 },
      { label: 'Mail', value: 20 },
    ];
    await settle(el);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    el.segments = [
      { label: 'Photos', value: 50 },
      { label: 'Mail', value: 10 },
    ];
    await settle(el);
    expect(widening(el)).toHaveLength(2);
  });
});
