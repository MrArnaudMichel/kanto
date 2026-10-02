import { describe, expect, it, vi } from 'vitest';
import { fixture, formFixture, settle } from '#test/fixture';
import './kt-slider.js';
import type { KtSlider } from 'kanto-ds';

const thumbs = (el: KtSlider) => [
  ...el.shadowRoot!.querySelectorAll<HTMLInputElement>('input[type="range"]'),
];

async function slide(el: KtSlider, index: number, value: number, commit = true) {
  const input = thumbs(el)[index]!;
  input.value = String(value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  if (commit) input.dispatchEvent(new Event('change', { bubbles: true }));
  await settle(el);
}

describe('kt-slider', () => {
  it('is one native range input, named by its label, within min and max', async () => {
    const el = await fixture<KtSlider>(
      '<kt-slider label="Volume" min="0" max="10" value="4"></kt-slider>',
    );
    const [input] = thumbs(el);
    expect(thumbs(el)).toHaveLength(1);
    expect(input!.getAttribute('aria-label')).toBe('Volume');
    expect(input!.min).toBe('0');
    expect(input!.max).toBe('10');
    expect(input!.value).toBe('4');
  });

  it('keeps its value within its bounds and on its step', async () => {
    const el = await fixture<KtSlider>(
      '<kt-slider min="0" max="100" step="5" value="42"></kt-slider>',
    );
    expect(el.value).toBe('40');
    el.value = '400';
    await settle(el);
    expect(el.value).toBe('100');
  });

  it('reports while sliding and once let go', async () => {
    const el = await fixture<KtSlider>('<kt-slider value="10"></kt-slider>');
    const input = vi.fn();
    const change = vi.fn();
    el.addEventListener('kt-input', input);
    el.addEventListener('kt-change', change);
    await slide(el, 0, 30, false);
    expect(input.mock.calls[0]![0].detail).toEqual({ value: '30' });
    expect(change).not.toHaveBeenCalled();
    await slide(el, 0, 35);
    expect(change.mock.calls[0]![0].detail).toEqual({ value: '35' });
    expect(el.value).toBe('35');
  });

  it('shows its value, through format when given one', async () => {
    const el = await fixture<KtSlider>(
      '<kt-slider label="Budget" show-value value="1200" max="5000" step="100"></kt-slider>',
    );
    el.format = (n) => `$${n.toLocaleString('en-US')}`;
    await settle(el);
    expect(el.shadowRoot!.querySelector('.value')!.textContent!.trim()).toBe('$1,200');
    expect(thumbs(el)[0]!.getAttribute('aria-valuetext')).toBe('$1,200');
  });

  describe('as a range', () => {
    it('has two thumbs, named for each end, and an ISO-like "low/high" value', async () => {
      const el = await fixture<KtSlider>(
        '<kt-slider range label="Price" value="20/80"></kt-slider>',
      );
      expect(thumbs(el).map((t) => t.getAttribute('aria-label'))).toEqual([
        'Price, minimum',
        'Price, maximum',
      ]);
      expect(thumbs(el).map((t) => t.value)).toEqual(['20', '80']);
    });

    it('never lets the thumbs cross', async () => {
      const el = await fixture<KtSlider>('<kt-slider range value="20/80"></kt-slider>');
      await slide(el, 0, 95);
      expect(el.value).toBe('80/80');
      await slide(el, 1, 10);
      expect(el.value).toBe('80/80');
    });

    it('starts at its bounds without a value', async () => {
      const el = await fixture<KtSlider>('<kt-slider range min="10" max="50"></kt-slider>');
      expect(el.value).toBe('10/50');
    });
  });

  it('names its thumbs sensibly without a label', async () => {
    const el = await fixture<KtSlider>('<kt-slider range value="20/80"></kt-slider>');
    expect(thumbs(el).map((t) => t.getAttribute('aria-label'))).toEqual(['Minimum', 'Maximum']);
  });

  it('keeps the decimals of min as well as of step', async () => {
    const el = await fixture<KtSlider>(
      '<kt-slider min="0.5" max="10" step="1" value="1.5"></kt-slider>',
    );
    expect(el.value).toBe('1.5');
  });

  it('takes no input while disabled', async () => {
    const el = await fixture<KtSlider>('<kt-slider disabled></kt-slider>');
    expect(thumbs(el)[0]!.disabled).toBe(true);
  });
});

describe('kt-slider in a form', () => {
  it('submits its value under its name', async () => {
    const { element, internals } = await formFixture<KtSlider>(
      '<kt-slider name="volume" value="7" max="10"></kt-slider>',
    );
    expect(internals.setFormValue).toHaveBeenLastCalledWith('7');
    element.value = '9';
    await settle(element);
    expect(internals.setFormValue).toHaveBeenLastCalledWith('9');
  });

  it('goes back to its first value when its form resets', async () => {
    const el = await fixture<KtSlider>('<kt-slider value="30"></kt-slider>');
    await slide(el, 0, 60);
    el.formResetCallback();
    await settle(el);
    expect(el.value).toBe('30');
  });
});
