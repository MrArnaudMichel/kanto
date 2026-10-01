/**
 * The appearance scales in a real browser: calc() and round() over custom
 * properties resolve only there. Each token is read back by applying it to
 * a probe, since getComputedStyle returns a custom property as written.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import '../styles.css';
import '../index.js';
import { fixture, settle } from '#test/fixture';

type Probe = { property: string; read: keyof CSSStyleDeclaration };
const AS: Record<string, Probe> = {
  radius: { property: 'border-top-left-radius', read: 'borderTopLeftRadius' },
  length: { property: 'width', read: 'width' },
  padding: { property: 'padding', read: 'padding' },
  font: { property: 'font', read: 'font' },
};

/** What `token` resolves to on `element`, through the CSS property `kind` uses. */
function resolve(token: string, kind: keyof typeof AS, element: Element = document.body): string {
  const probe = document.createElement('div');
  probe.style.setProperty(AS[kind]!.property, `var(${token})`);
  probe.style.boxSizing = 'content-box';
  element.append(probe);
  const value = String(getComputedStyle(probe)[AS[kind]!.read]);
  probe.remove();
  return value;
}
const fontSize = (token: string, element?: Element) => {
  const probe = document.createElement('div');
  probe.style.font = `var(${token})`;
  (element ?? document.body).append(probe);
  const { fontSize: size, lineHeight, fontFamily } = getComputedStyle(probe);
  probe.remove();
  return { size, lineHeight, fontFamily };
};

afterEach(async () => {
  for (const name of ['radius', 'density', 'textSize', 'font']) {
    delete document.documentElement.dataset[name];
  }
  document.documentElement.removeAttribute('style');
  document.body.replaceChildren();
  await page.viewport(1280, 800);
});

describe('the default appearance', () => {
  it('keeps every desktop value', async () => {
    await page.viewport(1280, 800);
    expect(resolve('--border-radius', 'radius')).toBe('8px');
    expect(resolve('--border-radius-card', 'radius')).toBe('12px');
    expect(resolve('--radius-input', 'radius')).toBe('8px');
    expect(resolve('--radius-modal', 'radius')).toBe('12px');
    expect(resolve('--radius-sub-menu', 'radius')).toBe('2px');
    expect(resolve('--button-height-small', 'length')).toBe('32px');
    expect(resolve('--button-height', 'length')).toBe('40px');
    expect(resolve('--button-height-large', 'length')).toBe('48px');
    expect(resolve('--button-padding-x', 'length')).toBe('16px');
    expect(resolve('--padding-card', 'padding')).toBe('24px');
    expect(resolve('--padding-expand-item', 'padding')).toBe('8px 16px');
    expect(resolve('--gap-card', 'length')).toBe('20px');
    expect(fontSize('--font-normal-regular').size).toBe('14px');
    expect(fontSize('--font-title-h1')).toMatchObject({ size: '36px', lineHeight: '43px' });
    expect(fontSize('--font-normal-regular').fontFamily).toMatch(/^Mulish/);
    expect(fontSize('--font-title-h1').fontFamily).toMatch(/^Manrope/);
  });

  it('keeps every mobile value', async () => {
    await page.viewport(400, 800);
    expect(resolve('--button-height', 'length')).toBe('36px');
    expect(resolve('--padding-card', 'padding')).toBe('16px');
    expect(fontSize('--font-normal-regular')).toMatchObject({ size: '12px', lineHeight: '18px' });
  });
});

describe('the scale inputs', () => {
  it('scale radius, density and text, on whole pixels where it matters', () => {
    const root = document.documentElement;
    root.style.setProperty('--radius-scale', '1.75');
    root.style.setProperty('--density-scale', '0.85');
    root.style.setProperty('--text-scale', '1.125');
    expect(resolve('--radius-input', 'radius')).toBe('14px');
    expect(resolve('--button-height', 'length')).toBe('34px');
    expect(resolve('--button-height-small', 'length')).toBe('28px');
    // Spacing is not rounded: a fraction of a pixel in a padding moves no text.
    expect(resolve('--padding-card', 'padding')).toBe('20.4px');
    expect(fontSize('--font-normal-regular').size).toBe('15.75px');
  });

  it('compose with the mobile scale', async () => {
    await page.viewport(400, 800);
    document.documentElement.style.setProperty('--density-scale', '0.85');
    expect(resolve('--button-height', 'length')).toBe('30px'); // 36 × 0.85 = 30.6 → 30
  });

  it('take a font input for body and display', () => {
    document.documentElement.style.setProperty('--font-body', "'Inter', sans-serif");
    expect(fontSize('--font-normal-regular').fontFamily).toMatch(/^Inter/);
    expect(fontSize('--font-title-h1').fontFamily).toMatch(/^Manrope/);
  });

  it('let a nested setting keep the outer one', () => {
    const outer = document.createElement('div');
    outer.dataset['font'] = 'x';
    outer.style.setProperty('--font-body', "'Inter', sans-serif");
    const inner = document.createElement('div');
    inner.dataset['density'] = 'x';
    inner.style.setProperty('--density-scale', '0.85');
    outer.append(inner);
    document.body.append(outer);
    expect(fontSize('--font-normal-regular', inner).fontFamily).toMatch(/^Inter/);
    expect(resolve('--button-height', 'length', inner)).toBe('34px');
    expect(resolve('--button-height', 'length', outer)).toBe('40px');
  });
});

describe('the presets', () => {
  it('scale through their attributes', () => {
    const root = document.documentElement;
    root.dataset['radius'] = 'round';
    root.dataset['density'] = 'compact';
    root.dataset['textSize'] = 'large';
    root.dataset['font'] = 'system';
    expect(resolve('--radius-input', 'radius')).toBe('14px');
    expect(resolve('--button-height', 'length')).toBe('34px');
    expect(fontSize('--font-normal-regular').size).toBe('15.75px');
    expect(fontSize('--font-normal-regular').fontFamily).toMatch(/^system-ui/);
    expect(fontSize('--font-title-h1').fontFamily).toMatch(/^system-ui/);
  });

  it('sharpen and loosen', () => {
    const root = document.documentElement;
    root.dataset['radius'] = 'sharp';
    root.dataset['density'] = 'comfortable';
    expect(resolve('--radius-input', 'radius')).toBe('2px');
    expect(resolve('--button-height', 'length')).toBe('46px');
  });

  it('apply on a container inside a light subtree', () => {
    const light = document.createElement('div');
    light.dataset['theme'] = 'light';
    const box = document.createElement('div');
    box.dataset['density'] = 'compact';
    light.append(box);
    document.body.append(light);
    expect(resolve('--button-height', 'length', box)).toBe('34px');
  });
});

/** The element that carries each field's height. */
const FIELD: Record<string, string> = {
  'kt-input': '.field',
  'kt-select': '.trigger',
  'kt-date-input': '.field',
  'kt-time-input': '.field',
  'kt-date-picker': '.field',
};

describe.each([
  ['compact', 'small'],
  ['default', 'default'],
  ['comfortable', 'large'],
])('fields at density %s, text %s', (density, textSize) => {
  it('stand as tall as one another and the button height', async () => {
    document.documentElement.dataset['density'] = density;
    document.documentElement.dataset['textSize'] = textSize;
    const row = await fixture<HTMLDivElement>(`<div>
      <kt-input label="Name"></kt-input>
      <kt-select label="Country"></kt-select>
      <kt-date-input label="Due" locale="en-GB"></kt-date-input>
      <kt-time-input label="At" locale="en-GB"></kt-time-input>
      <kt-date-picker label="Due"></kt-date-picker>
    </div>`);
    await Promise.all([...row.children].map((el) => settle(el)));
    const heights = [...row.children].map(
      (el) => el.shadowRoot!.querySelector(FIELD[el.localName]!)!.getBoundingClientRect().height,
    );
    const expected = parseFloat(resolve('--button-height', 'length'));
    expect(heights).toEqual(heights.map(() => expected));
  });

  it('keep the radio dot centred on whole pixels', async () => {
    document.documentElement.dataset['density'] = density;
    document.documentElement.dataset['textSize'] = textSize;
    const radio = await fixture<HTMLElement>('<kt-radio value="a" checked>Yearly</kt-radio>');
    await settle(radio);
    const circle = radio.shadowRoot!.querySelector('.circle')!.getBoundingClientRect();
    const dot = radio.shadowRoot!.querySelector('.dot')!.getBoundingClientRect();
    expect(dot.left - circle.left).toBe(circle.right - dot.right);
    expect(dot.top - circle.top).toBe(circle.bottom - dot.bottom);
    expect(Number.isInteger(dot.left - circle.left)).toBe(true);
  });
});

describe('kt-table', () => {
  it('follows density and text size in its cells', async () => {
    await page.viewport(1280, 800);
    document.documentElement.dataset['density'] = 'compact';
    document.documentElement.dataset['textSize'] = 'large';
    const table = await fixture<HTMLElement & { columns: unknown; data: unknown }>(
      '<kt-table></kt-table>',
    );
    table.columns = [{ key: 'name', label: 'Name' }];
    table.data = [{ id: 1, name: 'Ada' }];
    await settle(table);
    const th = getComputedStyle(table.shadowRoot!.querySelector('th')!);
    const td = getComputedStyle(table.shadowRoot!.querySelector('td')!);
    expect(parseFloat(th.paddingTop)).toBeCloseTo(16 * 0.85, 1);
    expect(parseFloat(td.paddingTop)).toBeCloseTo(14 * 0.85, 1);
    expect(parseFloat(td.fontSize)).toBeCloseTo(14 * 1.125, 1);
  });
});
