/**
 * The slider with a real keyboard and pointer: native range inputs, laid one
 * over the other for a range — only a browser shows which thumb a click
 * reaches and how the keys move it.
 */
import { describe, expect, it } from 'vitest';
import { userEvent } from 'vitest/browser';
import { fixture, settle } from '#test/fixture';
import '../../../styles.css';
import './kt-slider.js';
import type { KtSlider } from 'kanto-ds';

const thumbs = (el: KtSlider) => [
  ...el.shadowRoot!.querySelectorAll<HTMLInputElement>('input[type="range"]'),
];

describe('kt-slider, for real', () => {
  it('moves on the arrows, by its step', async () => {
    const el = await fixture<KtSlider>(
      '<kt-slider label="Volume" value="40" step="5"></kt-slider>',
    );
    thumbs(el)[0]!.focus();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');
    await settle(el);
    expect(el.value).toBe('50');
  });

  it('moves one end of a range on its own keys, leaving the other', async () => {
    const el = await fixture<KtSlider>(
      '<kt-slider range label="Price" value="20/80" style="width: 400px"></kt-slider>',
    );
    thumbs(el)[1]!.focus();
    await userEvent.keyboard('{ArrowLeft}');
    await settle(el);
    expect(el.value).toBe('20/79');
  });

  it('puts the low thumb under the pointer when both meet at the top, so it can be pulled back', async () => {
    const el = await fixture<KtSlider>(
      '<kt-slider range label="Price" value="100/100" style="display:block;width:400px"></kt-slider>',
    );
    const box = el.shadowRoot!.querySelector('.control')!.getBoundingClientRect();
    const hit = el.shadowRoot!.elementFromPoint(box.right - 6, box.top + box.height / 2);
    expect(hit).toBe(thumbs(el)[0]);
  });

  it('keeps the high thumb under the pointer when both meet at the bottom', async () => {
    const el = await fixture<KtSlider>(
      '<kt-slider range label="Price" value="0/0" style="display:block;width:400px"></kt-slider>',
    );
    const box = el.shadowRoot!.querySelector('.control')!.getBoundingClientRect();
    const hit = el.shadowRoot!.elementFromPoint(box.left + 6, box.top + box.height / 2);
    expect(hit).toBe(thumbs(el)[1]);
  });
});
