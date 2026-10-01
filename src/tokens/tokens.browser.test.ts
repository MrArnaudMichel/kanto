/**
 * The token layer in a real browser: oklch(), color-mix() and custom
 * properties resolve only there. Colours are read back through a canvas,
 * because getComputedStyle leaves an oklch() colour in oklch.
 */
import { afterEach, describe, expect, it } from 'vitest';
import '../styles.css';
import { accentPalette, parseColor, setAccent } from '../theme/accent.js';

const canvas = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;

/** The sRGB a token paints, on `element`. */
function paint(token: string, element: Element = document.documentElement): number[] {
  const probe = document.createElement('span');
  probe.style.color = `var(${token})`;
  element.append(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  canvas.clearRect(0, 0, 1, 1);
  canvas.fillStyle = '#000';
  canvas.fillStyle = color;
  canvas.fillRect(0, 0, 1, 1);
  return [...canvas.getImageData(0, 0, 1, 1).data.slice(0, 3)];
}

function expectNear(actual: number[], expected: readonly number[]) {
  actual.forEach((c, i) => expect(Math.abs(c - expected[i]!)).toBeLessThanOrEqual(1));
}

/** Today's values, before the token layer read any input. */
const DARK: Record<string, [number, number, number]> = {
  '--color-primary-base': [95, 93, 234],
  '--color-primary-hover': [88, 86, 224],
  '--color-primary-text': [142, 151, 255],
  '--color-text-100': [244, 244, 245],
  '--color-text-400': [169, 169, 181],
  '--color-text-500': [101, 101, 114],
  '--color-text-600': [75, 75, 88],
  '--color-text-700': [66, 66, 77],
  '--color-text-800': [58, 58, 68],
  '--color-text-900': [39, 39, 42],
  '--color-dark-8': [19, 18, 22],
  '--color-dark-12': [29, 28, 34],
  '--color-dark-14': [34, 33, 39],
  '--color-dark-15': [36, 35, 41],
  '--color-dark-16': [38, 37, 44],
  '--color-dark-18': [43, 42, 50],
  '--color-dark-19': [45, 44, 53],
  '--color-dark-20': [48, 46, 56],
  '--color-dark-22': [53, 51, 61],
  '--color-dark-23': [55, 53, 64],
  '--color-dark-24': [58, 56, 67],
};
const LIGHT: Record<string, [number, number, number]> = {
  '--color-primary-base': [95, 93, 234],
  '--color-primary-text': [79, 48, 239],
  '--color-text-100': [28, 28, 30],
  '--color-text-400': [80, 80, 90],
  '--color-text-500': [110, 110, 120],
  '--color-text-600': [130, 130, 140],
  '--color-text-700': [155, 155, 165],
  '--color-text-800': [180, 180, 190],
  '--color-text-900': [220, 220, 225],
  '--color-dark-8': [255, 255, 255],
  '--color-dark-12': [250, 250, 252],
  '--color-dark-14': [245, 245, 247],
  '--color-dark-15': [242, 242, 245],
  '--color-dark-16': [238, 238, 241],
  '--color-dark-18': [232, 232, 236],
  '--color-dark-19': [228, 228, 233],
  '--color-dark-20': [222, 222, 228],
  '--color-dark-22': [215, 215, 222],
  '--color-dark-23': [210, 210, 218],
  '--color-dark-24': [205, 205, 212],
};

afterEach(() => {
  delete document.documentElement.dataset['theme'];
  delete document.documentElement.dataset['accent'];
  setAccent(null);
  document.body.replaceChildren();
});

describe('the default accent', () => {
  it('paints what Kanto painted before, in the dark theme', () => {
    for (const [token, rgb] of Object.entries(DARK)) expectNear(paint(token), rgb);
  });

  it('paints what Kanto painted before, in the light theme', () => {
    document.documentElement.dataset['theme'] = 'light';
    for (const [token, rgb] of Object.entries(LIGHT)) expectNear(paint(token), rgb);
  });
});

describe('a custom accent', () => {
  it('re-tints the primary and the neutrals', () => {
    setAccent('#16a34a');
    const green = accentPalette('#16a34a');
    expectNear(paint('--color-primary-base'), parseColor(green.base));
    expectNear(paint('--color-primary-text'), parseColor(green.textDark));
    const [r = 0, g = 0, b = 0] = paint('--color-dark-12');
    expect(g).toBeGreaterThan(r); // greenish now, no longer violet
    expect(g).toBeGreaterThan(b);
  });

  it('switches its text step with the theme, with no new call', () => {
    setAccent('#16a34a');
    document.documentElement.dataset['theme'] = 'light';
    expectNear(paint('--color-primary-text'), parseColor(accentPalette('#16a34a').textLight));
  });

  it('themes one container and nothing outside it', () => {
    const box = document.createElement('div');
    document.body.append(box);
    setAccent('#ea580c', box);
    expectNear(paint('--color-primary-base', box), parseColor(accentPalette('#ea580c').base));
    expectNear(paint('--color-primary-base'), DARK['--color-primary-base']!);
  });

  it('gives a container inside a light subtree the light text step', () => {
    const light = document.createElement('div');
    light.dataset['theme'] = 'light';
    const box = document.createElement('div');
    light.append(box);
    document.body.append(light);
    setAccent('#16a34a', box);
    expectNear(paint('--color-primary-text', box), parseColor(accentPalette('#16a34a').textLight));
  });
});
